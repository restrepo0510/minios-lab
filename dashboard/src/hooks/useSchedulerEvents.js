import { useState, useEffect, useRef, useCallback } from "react";

const DEFAULT_METRICS = {
  totalCreated: 0,
  activeCount: 0,
  terminatedCount: 0,
  totalSwitches: 0,
  totalCpu: 0,
  sliceMs: 500,
  uptime: 0,
};

let eventCounter = 0;

export default function useSchedulerEvents(url = "ws://172.24.43.125:8080") {
  const [connected, setConnected]     = useState(false);
  const [processes, setProcesses]     = useState({});    // keyed by pid
  const [ganttSegments, setSegments]  = useState([]);    // { pid, start, end }
  const [metrics, setMetrics]         = useState(DEFAULT_METRICS);
  const [events, setEvents]           = useState([]);    // raw event stream
  const [currentSlice, setCurrentSlice] = useState(500);
  const [isCapturing, setIsCapturing]  = useState(false);

  const wsRef       = useRef(null);
  const startRef    = useRef(Date.now());
  const captureStartRef = useRef(null);
  const currentRef  = useRef(null);   // { pid, start }
  const uptimeTimer = useRef(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const upsertProcess = useCallback((update) => {
    setProcesses((prev) => ({
      ...prev,
      [update.pid]: { ...prev[update.pid], ...update },
    }));
  }, []);

  const closeSegment = useCallback((pid, endTs) => {
    setSegments((prev) => {
      const idx = [...prev].reverse().findIndex(
        (s) => s.pid === pid && s.end === undefined
      );
      if (idx < 0) return prev;
      const realIdx = prev.length - 1 - idx;
      const next = [...prev];
      next[realIdx] = { ...next[realIdx], end: endTs };
      return next;
    });
  }, []);

  // ── Event handler ──────────────────────────────────────────────────────────
  const handleMessage = useCallback((raw) => {
    let ev;
    try { ev = JSON.parse(raw); } catch { return; }

    const ts = ev.timestamp ?? Date.now();
    const tagged = { ...ev, id: ++eventCounter, timestamp: ts };

    // Append to log (cap at 500)
    setEvents((prev) => {
      const next = [...prev, tagged];
      return next.length > 500 ? next.slice(-500) : next;
    });

    switch (ev.type) {
      // ── Process created ──────────────────────────────────────────────────
      case "PROCESS_CREATED": {
        upsertProcess({
          pid:      ev.pid,
          name:     ev.name ?? "unknown",
          arg:      ev.arg  ?? "",
          state:    "READY",
          cpu_ms:   0,
          wait_ms:  0,
          switches: 0,
          priority: ev.priority ?? "NORMAL",
          created:  ts,
        });
        setMetrics((m) => ({
          ...m,
          totalCreated: m.totalCreated + 1,
          activeCount:  m.activeCount  + 1,
        }));
        break;
      }

      // ── Context switch ───────────────────────────────────────────────────
      case "CONTEXT_SWITCH": {
        const { from_pid, to_pid, cpu_ms_from, slice_ms } = ev;

        // Close segment for outgoing process
        if (from_pid != null) {
          closeSegment(from_pid, ts);
          upsertProcess({
            pid:      from_pid,
            state:    "READY",
            cpu_ms:   cpu_ms_from ?? undefined,
          });
        }

        // Open segment for incoming process
        if (to_pid != null) {
          setSegments((prev) => [...prev, { pid: to_pid, start: ts }]);
          upsertProcess({
            pid:      to_pid,
            state:    "RUNNING",
          });
          // Track switches
          setProcesses((prev) =>
            Object.fromEntries(
              Object.entries(prev).map(([pid, p]) =>
                pid === to_pid.toString()
                  ? [pid, { ...p, switches: (p.switches || 0) + 1 }]
                  : [pid, p]
              )
            )
          );
        }

        setMetrics((m) => ({
          ...m,
          totalSwitches: m.totalSwitches + 1,
          sliceMs: slice_ms ?? m.sliceMs,
        }));
        if (slice_ms) setCurrentSlice(slice_ms);
        break;
      }

      // ── Scheduler started (first run) ────────────────────────────────────
      case "SCHEDULER_START": {
        const { pid, slice_ms } = ev;
        if (pid != null) {
          setSegments((prev) => [...prev, { pid, start: ts }]);
          upsertProcess({ pid, state: "RUNNING" });
        }
        setMetrics((m) => ({ ...m, sliceMs: slice_ms ?? m.sliceMs }));
        if (slice_ms) setCurrentSlice(slice_ms);
        break;
      }

      // ── Process terminated ───────────────────────────────────────────────
      case "PROCESS_TERMINATED": {
        const { pid, cpu_ms_total } = ev;
        closeSegment(pid, ts);
        upsertProcess({
          pid,
          state:  "TERMINATED",
          cpu_ms: cpu_ms_total ?? undefined,
        });
        setMetrics((m) => ({
          ...m,
          activeCount:     Math.max(m.activeCount - 1, 0),
          terminatedCount: m.terminatedCount + 1,
          totalCpu:        m.totalCpu + (cpu_ms_total ?? 0),
        }));
        break;
      }

      // ── Slice changed ────────────────────────────────────────────────────
      case "SLICE_CHANGED": {
        setMetrics((m) => ({ ...m, sliceMs: ev.slice_ms ?? m.sliceMs }));
        break;
      }

      // ── Stats snapshot ───────────────────────────────────────────────────
      case "STATS": {
        if (ev.metrics) {
          setMetrics((m) => ({ ...m, ...ev.metrics }));
        }
        if (ev.processes) {
          ev.processes.forEach((p) => upsertProcess(p));
        }
        break;
      }

      default:
        break;
    }
  }, [upsertProcess, closeSegment]);

  // ── WebSocket lifecycle ────────────────────────────────────────────────────
  useEffect(() => {
    let ws;
    let retryTimer;

    const connect = () => {
      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen  = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        retryTimer = setTimeout(connect, 2000);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (e) => handleMessage(e.data);
    };

    connect();

    // Uptime counter
    startRef.current = Date.now();
    uptimeTimer.current = setInterval(() => {
      setMetrics((m) => ({
        ...m,
        uptime: Math.floor((Date.now() - startRef.current) / 1000),
      }));
    }, 1000);

    return () => {
      clearTimeout(retryTimer);
      clearInterval(uptimeTimer.current);
      ws?.close();
    };
  }, [url, handleMessage]);

  const getRelativeTime = useCallback(() => {
    return captureStartRef.current ? (Date.now() - captureStartRef.current) / 1000 : 0;
  }, []);

  const startCapture = useCallback(() => {
    setIsCapturing(true);
    captureStartRef.current = Date.now();
  }, []);

  const stopCapture = useCallback(() => {
    setIsCapturing(false);
  }, []);

  const resetCapture = useCallback(() => {
    setIsCapturing(false);
    setEvents([]);
    setSegments([]);
    setProcesses({});
    setMetrics(DEFAULT_METRICS);
    captureStartRef.current = null;
    eventCounter = 0;
  }, []);

  return {
    processes,
    ganttSegments,
    metrics,
    events,
    connected,
    currentSlice,
    isCapturing,
    getRelativeTime,
    startCapture,
    stopCapture,
    resetCapture,
  };
}