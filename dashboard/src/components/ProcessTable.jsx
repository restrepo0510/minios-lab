const COLORS = ["#00ff88","#4dabff","#ffb300","#ff3d5a","#b388ff","#00e5ff","#ff7043","#69f0ae","#ea80fc","#ffd740"];
const processColor = (pid) => COLORS[Math.abs(pid) % COLORS.length];

function EmptyState({ icon, message }) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"1rem",padding:"4rem 2rem",background:"var(--bg1)",border:"1px solid var(--line)",borderRadius:"8px",minHeight:"200px"}}>
      <span style={{fontSize:"3rem",color:"var(--muted)",opacity:.4}}>{icon}</span>
      <p style={{fontFamily:"var(--font-mono)",fontSize:".8rem",color:"var(--muted)"}}>{message}</p>
    </div>
  );
}

const STATE_STYLE = {
  RUNNING:    { color: "#00ff88", bg: "rgba(0,255,136,0.12)", label: "▶ RUNNING"    },
  READY:      { color: "#4dabff", bg: "rgba(77,171,255,0.10)", label: "⏸ READY"     },
  TERMINATED: { color: "#5a7280", bg: "rgba(90,114,128,0.10)", label: "✕ TERMINATED" },
  ZOMBIE:     { color: "#ff3d5a", bg: "rgba(255,61,90,0.12)",  label: "☠ ZOMBIE"    },
};

function StateChip({ state }) {
  const s = STATE_STYLE[state] || STATE_STYLE.READY;
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: "4px",
      background: s.bg,
      color: s.color,
      fontFamily: "var(--font-mono)",
      fontSize: "0.7rem",
      fontWeight: 600,
      letterSpacing: "0.05em",
      border: `1px solid ${s.color}44`,
    }}>
      {s.label}
    </span>
  );
}

function Bar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{
      width: "100%", height: "6px", borderRadius: "3px",
      background: "rgba(255,255,255,0.06)", overflow: "hidden",
    }}>
      <div style={{
        width: `${pct}%`, height: "100%", borderRadius: "3px",
        background: color, boxShadow: `0 0 6px ${color}`,
        transition: "width 0.4s ease",
      }} />
    </div>
  );
}

export default function ProcessTable({ processes = {} }) {
  const procs = Object.values(processes);
  const maxCpu = Math.max(...procs.map((p) => p.cpu_ms || 0), 1);

  const active     = procs.filter((p) => p.state !== "TERMINATED");
  const terminated = procs.filter((p) => p.state === "TERMINATED");
  const all = [...active, ...terminated];

  if (all.length === 0) {
    return <EmptyState icon="⊞" message="No hay procesos. Usa  run programs/bin/countdown 20" />;
  }

  return (
    <div className="ptable-wrap">
      <div className="panel-header">
        <span className="panel-icon">⊞</span>
        <h2 className="panel-title">TABLA DE PROCESOS</h2>
        <span className="panel-badge">
          {active.length} activos · {terminated.length} terminados
        </span>
      </div>

      <div className="ptable-container">
        <table className="ptable">
          <thead>
            <tr>
              {["#","PID","PROCESO","ESTADO","CPU (ms)","ESPERA (ms)","SWITCHES","PRIORIDAD"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {all.map((p, i) => {
              const color = processColor(p.pid);
              const isRunning = p.state === "RUNNING";
              return (
                <tr key={p.pid} className={isRunning ? "row-running" : ""}>
                  <td className="td-idx">{i + 1}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: "2px",
                        background: color, flexShrink: 0,
                        boxShadow: isRunning ? `0 0 8px ${color}` : "none",
                      }} />
                      <span style={{
                        fontFamily: "var(--font-mono)", color,
                        fontSize: "0.8rem",
                      }}>
                        {p.pid}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      color: isRunning ? color : "var(--white)",
                      fontSize: "0.82rem",
                    }}>
                      {p.name}
                    </span>
                    {p.arg && (
                      <span style={{ color: "var(--muted)", fontSize: "0.7rem", marginLeft: "0.4rem" }}>
                        {p.arg}
                      </span>
                    )}
                  </td>
                  <td><StateChip state={p.state} /></td>
                  <td>
                    <div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--amber)" }}>
                        {(p.cpu_ms || 0).toLocaleString()}
                      </span>
                      <Bar value={p.cpu_ms || 0} max={maxCpu} color="var(--amber)" />
                    </div>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--blue)" }}>
                    {(p.wait_ms || 0).toLocaleString()}
                  </td>
                  <td>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: "0.8rem",
                      color: "var(--purple)",
                    }}>
                      {p.switches || 0}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: "0.75rem",
                      color: "var(--cyan)",
                    }}>
                      {p.priority ?? "NORMAL"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Column legend */}
      <div className="col-legend">
        <span>📌 CPU — tiempo total en CPU</span>
        <span>📌 ESPERA — tiempo bloqueado en cola</span>
        <span>📌 SWITCHES — context switches recibidos</span>
      </div>

      <style>{`
        .ptable-wrap { display: flex; flex-direction: column; gap: 1rem; }
        .ptable-container {
          overflow-x: auto;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--bg1);
        }
        .ptable {
          width: 100%; border-collapse: collapse;
          font-size: 0.82rem;
        }
        .ptable thead tr {
          border-bottom: 1px solid var(--line);
        }
        .ptable th {
          padding: 0.7rem 1rem;
          text-align: left;
          font-family: var(--font-mono);
          font-size: 0.62rem;
          letter-spacing: 0.15em;
          color: var(--muted);
          white-space: nowrap;
        }
        .ptable td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          vertical-align: middle;
          white-space: nowrap;
        }
        .td-idx { color: var(--muted); font-family: var(--font-mono); font-size: 0.72rem; }
        .row-running {
          background: rgba(0,255,136,0.04) !important;
        }
        .ptable tbody tr:hover { background: rgba(255,255,255,0.03); }
        .col-legend {
          display: flex; gap: 1.5rem; flex-wrap: wrap;
          padding: 0.6rem 1rem;
          background: var(--bg1); border: 1px solid var(--line); border-radius: 8px;
          font-family: var(--font-mono); font-size: 0.65rem; color: var(--muted);
        }
      `}</style>
    </div>
  );
}