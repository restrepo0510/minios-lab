const COLORS = ["#00ff88","#4dabff","#ffb300","#ff3d5a","#b388ff","#00e5ff","#ff7043","#69f0ae","#ea80fc","#ffd740"];
const processColor = (pid) => COLORS[Math.abs(pid) % COLORS.length];

function StatCard({ label, value, unit, color, sub }) {
  return (
    <div className="stat-card" style={{ "--accent": color }}>
      <div className="stat-value" style={{ color }}>
        {value ?? 0}<span className="stat-unit">{unit}</span>
      </div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="mini-bar-row">
      <span className="mini-bar-label">{label}</span>
      <div className="mini-bar-track">
        <div className="mini-bar-fill" style={{
          width: `${pct}%`, background: color,
          boxShadow: `0 0 6px ${color}`,
        }} />
      </div>
      <span className="mini-bar-val" style={{ color }}>{value.toLocaleString()}</span>
    </div>
  );
}

export default function MetricsPanel({ metrics = {}, processes = {} }) {
  const procs = Object.values(processes);
  const active     = procs.filter((p) => p.state !== "TERMINATED");
  const terminated = procs.filter((p) => p.state === "TERMINATED");
  const maxCpu     = Math.max(...procs.map((p) => p.cpu_ms || 0), 1);
  const maxSw      = Math.max(...procs.map((p) => p.switches || 0), 1);

  const avgCpu = active.length
    ? Math.round(active.reduce((s, p) => s + (p.cpu_ms || 0), 0) / active.length)
    : 0;
  const avgSwitches = active.length
    ? (active.reduce((s, p) => s + (p.switches || 0), 0) / active.length).toFixed(1)
    : 0;

  return (
    <div className="metrics-wrap">
      <div className="panel-header">
        <span className="panel-icon">◈</span>
        <h2 className="panel-title">MÉTRICAS AGREGADAS</h2>
        <span className="panel-badge">Round-Robin Scheduler</span>
      </div>

      {/* Top stats row */}
      <div className="stats-grid">
        <StatCard label="PROCESOS ACTIVOS"    value={active.length}             color="var(--green)"  />
        <StatCard label="TERMINADOS"          value={terminated.length}         color="var(--muted)"  />
        <StatCard label="TOTAL CPU"           value={metrics.totalCpu ?? 0}     unit=" ms" color="var(--amber)"  />
        <StatCard label="TOTAL SWITCHES"      value={metrics.totalSwitches ?? 0} color="var(--purple)" />
        <StatCard label="TIME SLICE"          value={metrics.sliceMs ?? 500}    unit=" ms" color="var(--cyan)"   />
        <StatCard label="CPU PROMEDIO"        value={avgCpu}                    unit=" ms" color="var(--blue)"   sub={`por proceso activo`} />
        <StatCard label="SWITCHES PROMEDIO"   value={avgSwitches}               color="var(--amber)"  sub={`por proceso activo`} />
        <StatCard label="UPTIME"              value={metrics.uptime ?? 0}       unit=" s"  color="var(--green)"  />
      </div>

      {/* Per-process breakdown */}
      {procs.length > 0 && (
        <div className="breakdown-section">
          <h3 className="breakdown-title">CPU por Proceso</h3>
          <div className="breakdown-bars">
            {procs.map((p) => (
              <MiniBar
                key={p.pid}
                label={`${p.name} (${p.pid})`}
                value={p.cpu_ms || 0}
                max={maxCpu}
                color={processColor(p.pid)}
              />
            ))}
          </div>
        </div>
      )}

      {procs.length > 0 && (
        <div className="breakdown-section">
          <h3 className="breakdown-title">Context Switches por Proceso</h3>
          <div className="breakdown-bars">
            {procs.map((p) => (
              <MiniBar
                key={p.pid}
                label={`${p.name} (${p.pid})`}
                value={p.switches || 0}
                max={maxSw}
                color={processColor(p.pid)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="info-box">
        <p className="info-row">
          <span className="info-key">Política:</span>
          <span className="info-val">Round-Robin FIFO — cola circular</span>
        </p>
        <p className="info-row">
          <span className="info-key">Señales:</span>
          <span className="info-val">SIGSTOP · SIGCONT · SIGKILL · SIGALRM · SIGCHLD</span>
        </p>
        <p className="info-row">
          <span className="info-key">Timer:</span>
          <span className="info-val">setitimer(ITIMER_REAL) → SIGALRM cada {metrics.sliceMs ?? 500} ms</span>
        </p>
        <p className="info-row">
          <span className="info-key">IPC:</span>
          <span className="info-val">AF_UNIX socket → Node.js bridge → WebSocket → Dashboard</span>
        </p>
      </div>

      <style>{`
        .metrics-wrap  { display: flex; flex-direction: column; gap: 1.25rem; }
        .stats-grid    { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
        .stat-card     {
          display: flex; flex-direction: column; align-items: flex-start;
          padding: 1.1rem 1.25rem;
          background: var(--bg1);
          border-left: 3px solid var(--accent, var(--green));
          position: relative;
        }
        .stat-card::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.015) 0%, transparent 60%);
          pointer-events: none;
        }
        .stat-value  { font-family: var(--font-mono); font-size: 2rem; line-height: 1; font-weight: 700; }
        .stat-unit   { font-size: 0.9rem; opacity: 0.7; margin-left: 2px; }
        .stat-label  { font-size: 0.6rem; letter-spacing: 0.18em; color: var(--muted); margin-top: 6px; }
        .stat-sub    { font-family: var(--font-mono); font-size: 0.62rem; color: var(--muted); margin-top: 2px; opacity: 0.6; }

        .breakdown-section {
          background: var(--bg1); border: 1px solid var(--line); border-radius: 8px;
          padding: 1rem 1.25rem;
        }
        .breakdown-title {
          font-size: 0.65rem; letter-spacing: 0.18em; color: var(--muted);
          margin-bottom: 0.9rem; font-weight: 600;
        }
        .breakdown-bars { display: flex; flex-direction: column; gap: 0.65rem; }
        .mini-bar-row   { display: flex; align-items: center; gap: 0.75rem; }
        .mini-bar-label {
          font-family: var(--font-mono); font-size: 0.72rem; color: var(--muted);
          width: 160px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis;
        }
        .mini-bar-track {
          flex: 1; height: 8px; border-radius: 4px;
          background: rgba(255,255,255,0.05); overflow: hidden;
        }
        .mini-bar-fill  { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
        .mini-bar-val   { font-family: var(--font-mono); font-size: 0.72rem; min-width: 60px; text-align: right; }

        .info-box {
          background: var(--bg1); border: 1px solid var(--line); border-radius: 8px;
          padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.55rem;
        }
        .info-row { display: flex; gap: 1rem; font-family: var(--font-mono); font-size: 0.73rem; }
        .info-key { color: var(--green); min-width: 80px; flex-shrink: 0; }
        .info-val { color: var(--muted); }
      `}</style>
    </div>
  );
}