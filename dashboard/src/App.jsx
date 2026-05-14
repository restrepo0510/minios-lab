import { useState } from 'react';
import useSchedulerEvents from './hooks/useSchedulerEvents';
import ProcessTable from './components/ProcessTable';
import GanttChart from './components/GanttChart';
import RegisterView from './components/RegisterView';
import MetricsPanel from './components/MetricsPanel';
import CaptureControls from './components/CaptureControls';

export default function App() {
  const {
    processes, events, connected, currentSlice,
    isCapturing, getRelativeTime,
    startCapture, stopCapture, resetCapture,
  } = useSchedulerEvents();
  const [selectedPid, setSelectedPid] = useState(null);

  const activeCount     = Object.values(processes).filter(p => p.state === 'RUNNING' || p.state === 'READY').length;
  const terminatedCount = Object.values(processes).filter(p => p.state === 'TERMINATED').length;
  const totalSwitches   = events.filter(e => e.type === 'CONTEXT_SWITCH').length;

  return (
    <div style={{minHeight:'100vh',background:'#080b0f',color:'#e8f0fe',fontFamily:"'Rajdhani',sans-serif",position:'relative'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:#080b0f}
        ::-webkit-scrollbar-thumb{background:#1e2d3d;border-radius:3px}
        .scanlines{position:fixed;inset:0;pointer-events:none;z-index:100;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.07) 2px,rgba(0,0,0,0.07) 4px)}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
      `}</style>
      <div className="scanlines"/>

      {/* ── HEADER ── */}
      <header style={{display:'flex',alignItems:'center',gap:'1rem',padding:'.6rem 1.5rem',background:'linear-gradient(90deg,#0d1117,#141a22)',borderBottom:'1px solid #1e2d3d',position:'sticky',top:0,zIndex:50}}>
        <div style={{display:'flex',alignItems:'center',gap:'.75rem',minWidth:180}}>
          <span style={{fontSize:'2rem',color:'#00ff88',filter:'drop-shadow(0 0 8px #00ff88)'}}>⬡</span>
          <div>
            <h1 style={{fontFamily:"'Share Tech Mono',monospace",fontSize:'1.3rem',color:'#00ff88',letterSpacing:'.12em',textShadow:'0 0 12px rgba(0,255,136,.5)'}}>miniOS</h1>
            <p style={{fontSize:'.58rem',color:'#5a7280',letterSpacing:'.25em'}}>SCHEDULER MONITOR v2.0</p>
          </div>
        </div>

        {/* KPI chips */}
        <div style={{display:'flex',gap:'.5rem',flex:1,justifyContent:'center',flexWrap:'wrap'}}>
          {[
            {label:'ACTIVOS',   value:activeCount,     color:'#00ff88'},
            {label:'SWITCHES',  value:totalSwitches,   color:'#ffb300'},
            {label:'SLICE',     value:`${currentSlice||500}ms`, color:'#00e5ff'},
            {label:'TERMINADOS',value:terminatedCount, color:'#ff3d5a'},
          ].map(k=>(
            <div key={k.label} style={{display:'flex',alignItems:'center',gap:'.4rem',padding:'.3rem .8rem',background:'rgba(255,255,255,0.04)',border:`1px solid ${k.color}33`,borderRadius:4}}>
              <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:'1rem',color:k.color}}>{k.value??0}</span>
              <span style={{fontSize:'.55rem',color:'#5a7280',letterSpacing:'.12em'}}>{k.label}</span>
            </div>
          ))}
        </div>

        {/* Status */}
        <div style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
          <span style={{width:8,height:8,borderRadius:'50%',background:connected?'#00ff88':'#ff3d5a',boxShadow:connected?'0 0 8px #00ff88':'none',animation:connected?'blink 2s infinite':'none'}}/>
          <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:'.7rem',color:'#5a7280',letterSpacing:'.15em'}}>{connected?'LIVE':'OFFLINE'}</span>
        </div>
      </header>

      {/* ── CAPTURE BAR ── */}
      <div style={{padding:'.6rem 1.5rem',background:'#0d1117',borderBottom:'1px solid #1e2d3d'}}>
        <CaptureControls
          isCapturing={isCapturing}
          onStart={startCapture}
          onStop={stopCapture}
          onReset={resetCapture}
          getRelativeTime={getRelativeTime}
        />
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:'1px',background:'#1e2d3d',padding:'1px',minHeight:'calc(100vh - 120px)'}}>

        {/* LEFT */}
        <div style={{display:'flex',flexDirection:'column',gap:'1px',background:'#1e2d3d'}}>

          {/* Gantt */}
          <div style={{background:'#0d1117',padding:'1.25rem 1.5rem'}}>
            <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:'.7rem',color:'#5a7280',letterSpacing:'.2em',marginBottom:'.75rem'}}>▦ GANTT CHART — USO DE CPU</p>
            <GanttChart processes={processes} getRelativeTime={getRelativeTime}/>
          </div>

          {/* Process Table */}
          <div style={{background:'#0d1117',padding:'1.25rem 1.5rem',flex:1}}>
            <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:'.7rem',color:'#5a7280',letterSpacing:'.2em',marginBottom:'.75rem'}}>⊞ PROCESS TABLE</p>
            <ProcessTable processes={processes} selectedPid={selectedPid} onSelect={setSelectedPid}/>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{display:'flex',flexDirection:'column',gap:'1px',background:'#1e2d3d'}}>

          {/* Metrics */}
          <div style={{background:'#0d1117',padding:'1.25rem'}}>
            <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:'.7rem',color:'#5a7280',letterSpacing:'.2em',marginBottom:'.75rem'}}>◈ MÉTRICAS</p>
            <MetricsPanel processes={processes} events={events} currentSlice={currentSlice} connected={connected}/>
          </div>

          {/* Register */}
          <div style={{background:'#0d1117',padding:'1.25rem'}}>
            <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:'.7rem',color:'#5a7280',letterSpacing:'.2em',marginBottom:'.75rem'}}>⊡ DETALLE PROCESO</p>
            <RegisterView processes={processes} selectedPid={selectedPid} events={events}/>
          </div>

          {/* Event Log */}
          <div style={{background:'#0d1117',padding:'1.25rem',flex:1}}>
            <p style={{fontFamily:"'Share Tech Mono',monospace",fontSize:'.7rem',color:'#5a7280',letterSpacing:'.2em',marginBottom:'.75rem'}}>≡ EVENTOS ({events.length})</p>
            <div style={{maxHeight:200,overflowY:'auto',display:'flex',flexDirection:'column',gap:2}}>
              {events.length===0
                ? <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:'.7rem',color:'#5a7280'}}>{isCapturing?'Esperando eventos...':'Captura pausada'}</span>
                : events.slice(-30).reverse().map((e,i)=>{
                    const colors = {CONTEXT_SWITCH:'#4dabff',PROCESS_CREATED:'#00ff88',PROCESS_TERMINATED:'#ff3d5a'};
                    const c = colors[e.type]||'#5a7280';
                    return (
                      <div key={i} style={{display:'flex',gap:'.5rem',alignItems:'center',padding:'3px 0',borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                        <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:'.62rem',color:c,flexShrink:0,padding:'1px 6px',border:`1px solid ${c}33`,borderRadius:3,background:`${c}10`}}>
                          {e.type==='CONTEXT_SWITCH'?'SWITCH':e.type==='PROCESS_CREATED'?'NEW':'END'}
                        </span>
                        <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:'.68rem',color:'#8899aa',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {e.from&&e.to?`${e.from}→${e.to}`:e.pid?`PID ${e.pid}`:''}{e.name?` ${e.name}`:''}
                        </span>
                      </div>
                    );
                  })
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
