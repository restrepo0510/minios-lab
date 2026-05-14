import { useRef, useEffect } from "react";

const EVENT_STYLES = {
  PROCESS_CREATED:    { color: "#00ff88", icon: "✚", label: "CREADO"    },
  CONTEXT_SWITCH:     { color: "#4dabff", icon: "⇄", label: "SWITCH"    },
  PROCESS_TERMINATED: { color: "#ff3d5a", icon: "✕", label: "FIN"       },
  PROCESS_KILLED:     { color: "#ff7043", icon: "⚡", label: "KILL"     },
  SLICE_CHANGED:      { color: "#ffb300", icon: "⏱", label: "SLICE"    },
  default:            { color: "#5a7280", icon: "·", label: "INFO"       },
};

function EventRow({ ev, idx }) {
  const s = EVENT_STYLES[ev.type] || EVENT_STYLES.default;
  const ts = ev.timestamp
    ? new Date(ev.timestamp).toLocaleTimeString("es-CO", { hour12: false })
    : "--:--:--";

  return (
    <div className="ev-row" style={{ animationDelay: `${idx * 0.02}s` }}>
      <span className="ev-ts">{ts}</span>
      <span className="ev-icon" style={{ color: s.color }}>{s.icon}</span>
      <span className="ev-badge" style={{
        color: s.color, border: `1px solid ${s.color}44`,
        background: `${s.color}10`,
      }}>
        {s.label}
      </span>
      <span className="ev-body">
        {ev.type === "CONTEXT_SWITCH" && ev.from_pid && ev.to_pid
          ? `PID ${ev.from_pid} → PID ${ev.to_pid}`
          : ev.pid
          ? `PID ${ev.pid}` + (ev.name ? ` · ${ev.name}` : "")
          : ""}
        {ev.slice_ms ? ` · ${ev.slice_ms} ms` : ""}
        {ev.message ? ` · ${ev.message}` : ""}
      </span>
    </div>
  );
}

export default function EventLog({ events = [] }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new events
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  const counts = {
    PROCESS_CREATED:    events.filter((e) => e.type === "PROCESS_CREATED").length,
    CONTEXT_SWITCH:     events.filter((e) => e.type === "CONTEXT_SWITCH").length,
    PROCESS_TERMINATED: events.filter((e) => e.type === "PROCESS_TERMINATED").length,
  };

  return (
    <div className="evlog-wrap">
      <div className="panel-header">
        <span className="panel-icon">≡</span>
        <h2 className="panel-title">EVENT LOG — Tiempo Real</h2>
        <span className="panel-badge">{events.length} eventos</span>
      </div>

      {/* Summary chips */}
      <div className="evlog-summary">
        {[
          { label: "CREADOS",  value: counts.PROCESS_CREATED,    color: "#00ff88" },
          { label: "SWITCHES", value: counts.CONTEXT_SWITCH,     color: "#4dabff" },
          { label: "FIN",      value: counts.PROCESS_TERMINATED, color: "#ff3d5a" },
        ].map((c) => (
          <div key={c.label} className="summary-chip" style={{ "--c": c.color }}>
            <span style={{ color: c.color, fontFamily: "var(--font-mono)", fontSize: "1.1rem" }}>
              {c.value}
            </span>
            <span style={{ fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.15em" }}>
              {c.label}
            </span>
          </div>
        ))}
      </div>

      {/* Log stream */}
      <div className="evlog-stream">
        {events.length === 0 ? (
          <div className="evlog-empty">
            <span style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
              Esperando eventos del scheduler…
            </span>
          </div>
        ) : (
          <>
            {events.slice().reverse().map((ev, i) => (
              <EventRow key={ev.id ?? i} ev={ev} idx={i} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <style>{`
        .evlog-wrap { display: flex; flex-direction: column; gap: 1rem; }
        .evlog-summary {
          display: flex; gap: 1px;
          background: var(--line); border: 1px solid var(--line);
          border-radius: 8px; overflow: hidden;
        }
        .summary-chip {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          padding: 0.75rem;
          background: var(--bg1);
          border-bottom: 2px solid var(--c, var(--muted));
          gap: 4px;
        }
        .evlog-stream {
          flex: 1; overflow-y: auto; max-height: 65vh;
          background: var(--bg1); border: 1px solid var(--line); border-radius: 8px;
          padding: 0.5rem 0;
          display: flex; flex-direction: column;
        }
        .evlog-empty {
          display: flex; align-items: center; justify-content: center;
          min-height: 150px;
        }
        .ev-row {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.4rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.025);
          animation: fadeIn 0.2s ease both;
        }
        .ev-row:hover { background: rgba(255,255,255,0.02); }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .ev-ts {
          font-family: var(--font-mono); font-size: 0.68rem;
          color: var(--muted); min-width: 80px; flex-shrink: 0;
        }
        .ev-icon { font-size: 0.9rem; min-width: 16px; flex-shrink: 0; }
        .ev-badge {
          font-family: var(--font-mono); font-size: 0.62rem;
          padding: 1px 7px; border-radius: 3px;
          letter-spacing: 0.08em;
          white-space: nowrap; flex-shrink: 0;
        }
        .ev-body {
          font-family: var(--font-mono); font-size: 0.75rem;
          color: var(--white); opacity: 0.8;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
}