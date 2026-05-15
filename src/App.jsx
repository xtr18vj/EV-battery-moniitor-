import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Battery, Zap, Thermometer, Activity, Shield, ShieldCheck, ShieldAlert, Radio, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import io from 'socket.io-client';
import './App.css';

// ─── Floating Particles ───
function Particles() {
  const particles = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i, left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 15}s`, duration: `${12 + Math.random() * 10}s`,
    size: 1 + Math.random() * 2, opacity: 0.15 + Math.random() * 0.25,
  })), []);
  return (
    <div className="particle-container">
      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          left: p.left, width: p.size, height: p.size, opacity: p.opacity,
          animationDelay: p.delay, animationDuration: p.duration,
        }} />
      ))}
    </div>
  );
}

// ─── Nav Bar ───
function NavBar({ status, connected, time }) {
  const statusClass = status === 'Warning' ? 'warning' : status === 'Critical' ? 'critical' : 'normal';
  return (
    <nav className="navbar">
      <div style={{ padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: '0.625rem', background: 'linear-gradient(135deg, #00e5ff, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Battery size={20} color="#fff" />
          </div>
          <div>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em' }}>EV Battery Monitor</span>
            <div className="data-source-tag" style={{ marginLeft: 8, verticalAlign: 'middle', display: 'inline-flex' }}>
              <Radio size={8} /> LIVE
            </div>
          </div>
        </motion.div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className={`status-badge ${statusClass}`}>
            <div className="pulse-dot" style={{ background: statusClass === 'normal' ? '#34d399' : statusClass === 'warning' ? '#fbbf24' : '#f87171' }} />
            {status}
          </div>
          <div className={`connection-indicator ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
            {connected ? 'Online' : 'Offline'}
          </div>
          <div className="text-mono" style={{ fontSize: '0.8rem', color: '#64748b' }}>
            {time.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </nav>
  );
}

// ─── Battery Ring SVG ───
function BatteryRing({ percentage, health }) {
  const r = 115, c = 2 * Math.PI * r;
  const offset = c - (percentage / 100) * c;
  const color = percentage >= 70 ? '#34d399' : percentage >= 40 ? '#00e5ff' : percentage >= 20 ? '#fbbf24' : '#f87171';
  return (
    <div className="battery-ring-container">
      <div className="battery-ring-bg" />
      <div className="battery-ring-glow" style={{ background: `radial-gradient(circle, ${color}40, transparent 70%)` }} />
      <svg width="280" height="280" viewBox="0 0 280 280" style={{ position: 'relative', zIndex: 1, transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={percentage >= 70 ? '#00e5ff' : color} />
          </linearGradient>
        </defs>
        <circle cx="140" cy="140" r={r} stroke="rgba(148,163,184,0.06)" strokeWidth="10" fill="none" />
        <motion.circle cx="140" cy="140" r={r} stroke="url(#ringGrad)" strokeWidth="10" fill="none"
          strokeDasharray={c} initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }} transition={{ duration: 1.5, ease: 'easeInOut' }}
          strokeLinecap="round" style={{ filter: `drop-shadow(0 0 12px ${color}80)` }} />
      </svg>
      <div className="battery-center-content">
        <motion.p className="battery-percentage" style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          {percentage.toFixed(0)}%
        </motion.p>
        <p className="battery-label">State of Charge</p>
      </div>
    </div>
  );
}

// ─── Metric Card ───
function MetricCard({ title, value, unit, accent, icon: Icon, data, dataKey, delay = 0 }) {
  const accentMap = {
    cyan: { color: '#00e5ff', gradient: ['#00e5ff', '#0ea5e9'] },
    purple: { color: '#a855f7', gradient: ['#a855f7', '#7c3aed'] },
    green: { color: '#10b981', gradient: ['#10b981', '#34d399'] },
    amber: { color: '#f59e0b', gradient: ['#f59e0b', '#fbbf24'] },
    blue: { color: '#3b82f6', gradient: ['#3b82f6', '#60a5fa'] },
    pink: { color: '#ec4899', gradient: ['#ec4899', '#f472b6'] },
  };
  const a = accentMap[accent] || accentMap.cyan;
  return (
    <motion.div className={`metric-card glass-panel ${accent}`}
      initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }} whileHover={{ y: -4 }}
      style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: data ? '0.75rem' : 0 }}>
        <div>
          <p style={{ fontSize: '0.775rem', color: '#64748b', fontWeight: 500, marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</span>
            <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>{unit}</span>
          </div>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: '0.625rem', background: `${a.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={a.color} />
        </div>
      </div>
      {data && data.length > 0 && (
        <div style={{ height: 80, marginTop: '0.5rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`grad-${accent}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={a.color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={a.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey={dataKey || 'value'} stroke={a.color} strokeWidth={2} fill={`url(#grad-${accent})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

// ─── Alert Panel ───
function AlertPanel({ batteryData }) {
  const alerts = useMemo(() => {
    const v = batteryData.voltage, c = batteryData.current, t = batteryData.temperature;
    return [
      { title: 'Voltage', value: `${v.toFixed(0)}V`, status: v > 450 ? 'Over' : v < 350 ? 'Under' : 'Normal', color: (v > 450 || v < 350) ? 'red' : 'green', icon: Zap },
      { title: 'Current', value: `${Math.abs(c).toFixed(0)}A`, status: c > 120 ? 'Over' : 'Normal', color: c > 120 ? 'red' : 'green', icon: Activity },
      { title: 'Temperature', value: `${t.toFixed(0)}°C`, status: t > 65 ? 'Hot' : t < -10 ? 'Cold' : 'Normal', color: (t > 65 || t < -10) ? 'amber' : 'green', icon: Thermometer },
      { title: 'Relay', value: batteryData.relayStatus, status: batteryData.relayStatus, color: batteryData.relayStatus === 'ON' ? 'green' : 'amber', icon: Shield },
      { title: 'System', value: batteryData.systemStatus, status: batteryData.systemStatus, color: batteryData.systemStatus === 'Normal' ? 'green' : batteryData.systemStatus === 'Warning' ? 'amber' : 'red', icon: batteryData.systemStatus === 'Normal' ? ShieldCheck : ShieldAlert },
    ];
  }, [batteryData]);

  return (
    <motion.div className="glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '2rem', marginBottom: '2rem' }}>
      <div className="section-header">
        <div><h2>Protection System</h2><p>Real-time safety monitoring & alerts</p></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
        {alerts.map((a, i) => {
          const colors = { green: '#34d399', amber: '#fbbf24', red: '#f87171' };
          const clr = colors[a.color];
          return (
            <motion.div key={i} className="alert-item" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <div className={`alert-icon ${a.color}`}><a.icon size={16} /></div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 2 }}>{a.title}</p>
                <p className="text-mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: clr }}>{a.value}</p>
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '0.375rem', background: `${clr}15`, color: clr, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{a.status}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Analytics ───
function AnalyticsSection({ timeRange, setTimeRange, data24h, data7d }) {
  return (
    <motion.div className="glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '2rem', marginBottom: '2rem' }}>
      <div className="section-header">
        <div><h2>Data Analytics</h2><p>Historical trends & performance</p></div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['24h', '7d'].map(r => (
            <button key={r} className={`btn-ghost ${timeRange === r ? 'active' : ''}`} onClick={() => setTimeRange(r)}>
              {r === '24h' ? '24 Hours' : '7 Days'}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={timeRange === '24h' ? data24h : data7d}>
            <defs>
              <linearGradient id="socFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#00e5ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
            <XAxis dataKey={timeRange === '24h' ? 'time' : 'day'} stroke="#475569" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis stroke="#475569" tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip contentStyle={{ background: 'rgba(8,12,30,0.95)', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)' }} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            <Area type="monotone" dataKey="soc" stroke="#00e5ff" strokeWidth={2} fill="url(#socFill)" name="SOC %" dot={false} />
            {timeRange === '24h' && <Area type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2} fill="url(#tempFill)" name="Temp °C" dot={false} />}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// ─── System Logs ───
function SystemLogs({ logs }) {
  return (
    <motion.div className="glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '2rem' }}>
      <div className="section-header">
        <div><h2>System Activity</h2><p>Recent events & diagnostics</p></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b', fontSize: '0.75rem' }}>
          <Clock size={13} /> Auto-updating
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxHeight: 280, overflowY: 'auto', position: 'relative', paddingLeft: '0.25rem' }}>
        {logs.map((log, i) => (
          <motion.div key={i} className={`log-entry ${log.type}`} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.25rem', borderRadius: '0.625rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'all 0.2s' }}
            whileHover={{ x: 4, background: 'rgba(0,0,0,0.3)' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>{log.title}</h4>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{log.message}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
              <span className="text-mono" style={{ fontSize: '0.7rem', color: '#475569' }}>{log.timestamp}</span>
              <ChevronRight size={14} color="#475569" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Data Generators ───
const gen24h = () => Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`, soc: 20 + Math.sin(i * 0.3) * 30 + Math.random() * 10,
  soh: 95 - Math.random() * 2, temp: 35 + Math.sin(i * 0.2) * 10 + Math.random() * 5,
  power: 30 + Math.sin(i * 0.4) * 25 + Math.random() * 10,
}));

const gen7d = () => Array.from({ length: 7 }, (_, i) => ({
  day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  soc: 60 + Math.random() * 30, efficiency: 92 + Math.random() * 4,
}));

const defaultLogs = [
  { id: 1, timestamp: '14:32:15', type: 'success', title: 'Battery fully charged', message: 'SOC reached 100% — Charging complete' },
  { id: 2, timestamp: '14:25:42', type: 'info', title: 'Charging initiated', message: 'Charging started at 25.5kW power level' },
  { id: 3, timestamp: '14:18:09', type: 'success', title: 'Temperature normalized', message: 'Battery temp returned to safe range (45°C)' },
  { id: 4, timestamp: '14:10:33', type: 'warning', title: 'High temperature warning', message: 'Battery temperature exceeded 50°C threshold' },
  { id: 5, timestamp: '14:02:11', type: 'info', title: 'Cell balancing active', message: 'Automatic cell balancing initiated for pack #2' },
];

// ─── Main App ───
export default function App() {
  const [batteryData, setBatteryData] = useState({
    voltage: 0, current: 0, temperature: 0, soc: 0, soh: 0, power: 0,
    relayStatus: 'OFF', systemStatus: 'Normal', timestamp: new Date(),
  });
  const [isConnected, setIsConnected] = useState(false);
  const [time, setTime] = useState(new Date());
  const [timeRange, setTimeRange] = useState('24h');
  const [dataHistory, setDataHistory] = useState([]);

  useEffect(() => {
    const sock = io('http://localhost:3001', { reconnection: true, reconnectionDelay: 1000, reconnectionAttempts: 5 });
    sock.on('connect', () => setIsConnected(true));
    sock.on('battery_data', (d) => {
      setBatteryData(d);
      setDataHistory(prev => [...prev.slice(-49), {
        time: new Date(d.timestamp).toLocaleTimeString(), voltage: d.voltage,
        current: d.current, temperature: d.temperature, soc: d.soc, soh: d.soh, power: d.power,
      }]);
    });
    sock.on('connection_status', (s) => setIsConnected(s.connected));
    sock.on('disconnect', () => setIsConnected(false));
    return () => sock.disconnect();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const chartData = dataHistory.length > 0 ? dataHistory : gen24h();
  const d24h = useMemo(gen24h, []);
  const d7d = useMemo(gen7d, []);
  const bd = batteryData;

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="app-background" />
      <Particles />
      <div className="content-wrapper">
        <NavBar status={bd.systemStatus} connected={isConnected} time={time} />
        <main>
          {/* Hero: Battery + Info */}
          <motion.div className="glass-panel" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '2.5rem', marginBottom: '2rem' }}>
            <div className="hero-section">
              <div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Battery Health Overview</p>
                <h1 className="heading-xl" style={{ marginBottom: '0.5rem' }}>
                  <span className="text-gradient">Real-Time</span>
                  <br />Monitoring
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem', maxWidth: 400, lineHeight: 1.7 }}>
                  Advanced battery management with live telemetry from your EV's STM32 controller.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  <div className="info-chip">
                    <span className="info-chip-label">State of Health</span>
                    <span className="info-chip-value" style={{ color: '#34d399' }}>{bd.soh.toFixed(1)}%</span>
                  </div>
                  <div className="info-chip">
                    <span className="info-chip-label">Battery State</span>
                    <span className="info-chip-value" style={{ color: '#00e5ff' }}>
                      {bd.current > 0 ? 'Charging' : bd.current < 0 ? 'Discharging' : 'Idle'}
                    </span>
                  </div>
                  <div className="info-chip">
                    <span className="info-chip-label">Charge Cycles</span>
                    <span className="info-chip-value" style={{ color: '#a855f7' }}>234</span>
                  </div>
                  <div className="info-chip">
                    <span className="info-chip-label">Est. Time Remaining</span>
                    <span className="info-chip-value" style={{ color: '#f59e0b' }}>3h 45m</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <BatteryRing percentage={bd.soc} health={bd.soh} />
              </div>
            </div>
          </motion.div>

          {/* Live Metrics */}
          <div className="section-label">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0' }}>Live Metrics</h2>
          </div>
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <MetricCard title="Voltage" value={bd.voltage.toFixed(1)} unit="V" accent="cyan" icon={Zap} data={chartData} dataKey="voltage" delay={0.05} />
            <MetricCard title="Current" value={Math.abs(bd.current).toFixed(1)} unit="A" accent="purple" icon={Activity} data={chartData} dataKey="current" delay={0.1} />
            <MetricCard title="Temperature" value={bd.temperature.toFixed(1)} unit="°C" accent="amber" icon={Thermometer} data={chartData} dataKey="temperature" delay={0.15} />
            <MetricCard title="Power Output" value={bd.power.toFixed(1)} unit="kW" accent="blue" icon={TrendingUp} data={chartData} dataKey="power" delay={0.2} />
            <MetricCard title="State of Charge" value={bd.soc.toFixed(1)} unit="%" accent="green" icon={Battery} delay={0.25} />
            <MetricCard title="State of Health" value={bd.soh.toFixed(1)} unit="%" accent="pink" icon={ShieldCheck} delay={0.3} />
          </div>

          {/* Alert Panel */}
          <AlertPanel batteryData={bd} />

          {/* Analytics */}
          <AnalyticsSection timeRange={timeRange} setTimeRange={setTimeRange} data24h={d24h} data7d={d7d} />

          {/* System Logs */}
          <SystemLogs logs={defaultLogs} />
        </main>
      </div>
    </div>
  );
}
