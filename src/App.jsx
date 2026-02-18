import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wifi, WifiOff, Settings, Battery, AlertTriangle, CheckCircle, Info, Clock,
  Zap, Download, TrendingUp 
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import io from 'socket.io-client';
import './App.css';

// Generate sample data
const generateVoltageData = () =>
  Array.from({ length: 20 }, (_, i) => ({
    time: `${i}s`,
    value: 400 + Math.sin(i * 0.5) * 30 + Math.random() * 10,
  }));

const generateCurrentData = () =>
  Array.from({ length: 20 }, (_, i) => ({
    time: `${i}s`,
    value: 85 + Math.sin(i * 0.3) * 15 + Math.random() * 5,
  }));

const generatePowerData = () =>
  Array.from({ length: 20 }, (_, i) => ({
    time: `${i}s`,
    value: 165 + Math.sin(i * 0.4) * 25 + Math.random() * 10,
  }));

const generate24HourData = () =>
  Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    soc: 20 + Math.sin(i * 0.3) * 30 + Math.random() * 10,
    soh: 95 - Math.random() * 2,
    temp: 35 + Math.sin(i * 0.2) * 10 + Math.random() * 5,
    power: 30 + Math.sin(i * 0.4) * 25 + Math.random() * 10,
  }));

const generate7DayData = () =>
  Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    efficiency: 92 + Math.random() * 4,
    cycles: 15 + Math.floor(Math.random() * 10),
    avgTemp: 38 + Math.random() * 8,
  }));

const generateLogs = () => [
  { id: 1, timestamp: '14:32:15', type: 'success', title: 'Battery fully charged', message: 'SOC reached 100% - Charging complete' },
  { id: 2, timestamp: '14:25:42', type: 'info', title: 'Charging initiated', message: 'Charging started at 25.5kW power level' },
  { id: 3, timestamp: '14:18:09', type: 'success', title: 'Temperature normalized', message: 'Battery temp returned to safe range (45°C)' },
  { id: 4, timestamp: '14:10:33', type: 'warning', title: 'High temperature warning', message: 'Battery temperature exceeded 50°C threshold' },
];

// Top Navigation
function TopNavBar({ batteryStatus, isConnected, time }) {
  const statusColors = {
    Normal: { bg: 'rgba(0, 255, 0, 0.2)', border: 'rgba(0, 255, 0, 0.5)', text: '#00ff00' },
    Warning: { bg: 'rgba(255, 255, 0, 0.2)', border: 'rgba(255, 255, 0, 0.5)', text: '#ffff00' },
    Critical: { bg: 'rgba(255, 0, 80, 0.2)', border: 'rgba(255, 0, 80, 0.5)', text: '#ff0050' },
  };

  const colors = statusColors[batteryStatus];

  return (
    <nav className="sticky top-0 z-50" style={{ 
      backdropFilter: 'blur(20px)',
      background: 'rgba(10, 14, 39, 0.7)',
      borderBottom: '1px solid rgba(30, 40, 71, 1)',
    }}>
      <div style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '40px', height: '40px', borderRadius: '0.5rem',
            background: 'linear-gradient(to bottom right, #00d4ff, #00ff00)',
          }}>
            <Battery style={{ width: '24px', height: '24px', color: 'white' }} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>EV Monitor</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '0.5rem 1rem', borderRadius: '9999px', border: `1px solid ${colors.border}`,
            background: colors.bg, display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.text }}
          />
          <span style={{ fontSize: '14px', fontWeight: '600', color: colors.text }}>{batteryStatus}</span>
        </motion.div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ fontSize: '14px', color: '#d1d5db', fontFamily: 'monospace' }}>
            {time.toLocaleTimeString()}
          </div>
          <div style={{ color: isConnected ? '#00ff00' : '#ff0050' }}>
            {isConnected ? <Wifi style={{ width: '20px', height: '20px' }} /> : <WifiOff style={{ width: '20px', height: '20px' }} />}
          </div>
          <button style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db' }}>
            <Settings style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
      </div>
    </nav>
  );
}

// Battery Health Card
function BatteryHealthCard({ percentage = 82, health = 95 }) {
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 80 ? '#00ff00' : percentage >= 50 ? '#00d4ff' : '#ffff00';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '1rem',
        padding: '2rem',
        marginBottom: '2rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>Battery Health</h2>
          <p style={{ color: '#9ca3af' }}>Real-time monitoring & analytics</p>
        </div>
        <div style={{
          padding: '0.5rem 1rem', borderRadius: '0.5rem',
          background: 'rgba(0, 255, 0, 0.2)', border: '1px solid rgba(0, 255, 0, 0.5)',
        }}>
          <span style={{ color: '#00ff00', fontWeight: '600' }}>{health}%</span>
          <p style={{ fontSize: '12px', color: '#9ca3af' }}>SOH</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '256px', height: '256px' }}>
          <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 300 300">
            <circle cx="150" cy="150" r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
            <motion.circle cx="150" cy="150" r={radius} stroke={color} strokeWidth="8" fill="none"
              strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }} transition={{ duration: 1, ease: 'easeInOut' }}
              strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexDirection: 'column',
          }}>
            <p style={{ fontSize: '48px', fontWeight: 'bold', color, margin: 0 }}>{percentage}%</p>
            <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '0.5rem' }}>State of Charge</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: '256px' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '0.5rem' }}>Battery State</p>
            <p style={{ fontSize: '20px', fontWeight: '600', color: 'white' }}>Charging</p>
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '0.5rem' }}>Est. Time Remaining</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#00d4ff' }}>3h 45m</p>
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '1rem' }}>Quick Stats</p>
            <p style={{ display: 'flex', justifyContent: 'space-between', color: '#d1d5db', fontSize: '14px', marginBottom: '0.5rem' }}>
              <span>Cycles:</span> <span style={{ color: '#00d4ff', fontWeight: '600' }}>234</span>
            </p>
            <p style={{ display: 'flex', justifyContent: 'space-between', color: '#d1d5db', fontSize: '14px' }}>
              <span>Capacity Loss:</span> <span style={{ color: '#00ff00', fontWeight: '600' }}>5%</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Monitor Card
function MonitorCard({ title, value, unit, color, data, dataKey }) {
  const colorMap = { blue: '#00d4ff', green: '#00ff00', purple: '#d946ef', red: '#ff0050' };
  const colorStyle = colorMap[color];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '0.25rem' }}>{title}</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{value}</span>
            <span style={{ fontSize: '14px', color: '#9ca3af' }}>{unit}</span>
          </div>
        </div>
        <TrendingUp style={{ width: '20px', height: '20px', color: colorStyle, opacity: 0.7 }} />
      </div>
      {data && (
        <div style={{ height: '96px', marginTop: '1rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line type="monotone" dataKey={dataKey || 'value'} stroke={colorStyle} strokeWidth={2} dot={false} isAnimationActive />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

// Alert Panel
function AlertPanel({ batteryData }) {
  const getAlerts = () => {
    const alerts = [];
    
    // Check voltage
    const voltageStatus = batteryData.voltage > 450 ? 'Over' : batteryData.voltage < 350 ? 'Under' : 'Normal';
    const voltageColor = voltageStatus === 'Normal' ? 'green' : 'red';
    alerts.push({
      title: 'Overvoltage Protection',
      value: `${voltageStatus} (${batteryData.voltage.toFixed(0)}/450V)`,
      color: voltageColor
    });

    // Check current
    const currentStatus = batteryData.current > 120 ? 'Over' : batteryData.current < -50 ? 'Reverse' : 'Normal';
    const currentColor = currentStatus === 'Normal' ? 'green' : 'red';
    alerts.push({
      title: 'Overcurrent Detection',
      value: `${currentStatus} (${Math.abs(batteryData.current).toFixed(0)}/120A)`,
      color: currentColor
    });

    // Check temperature
    const tempStatus = batteryData.temperature > 65 ? 'Hot' : batteryData.temperature < -10 ? 'Cold' : 'Normal';
    const tempColor = tempStatus === 'Normal' ? 'green' : 'yellow';
    alerts.push({
      title: 'Temperature Monitor',
      value: `${tempStatus} (${batteryData.temperature.toFixed(0)}/65°C)`,
      color: tempColor
    });

    // Relay status
    alerts.push({
      title: 'Relay Status',
      value: batteryData.relayStatus,
      color: batteryData.relayStatus === 'ON' ? 'green' : 'yellow'
    });

    // System status
    alerts.push({
      title: 'System Status',
      value: batteryData.systemStatus,
      color: batteryData.systemStatus === 'Normal' ? 'green' : batteryData.systemStatus === 'Warning' ? 'yellow' : 'red'
    });

    return alerts;
  };

  const alerts = getAlerts();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '1rem',
        padding: '2rem',
        marginBottom: '2rem',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>Alert & Protection System</h3>
        <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '0.25rem' }}>Real-time safety monitoring</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {alerts.map((alert, i) => {
          const colorMap = { green: '#00ff00', yellow: '#ffff00', red: '#ff0050' };
          return (
            <div key={i} style={{
              background: 'rgba(0, 0, 0, 0.3)', borderRadius: '0.75rem', padding: '1rem',
              border: `1px solid ${colorMap[alert.color] || '#ffffff'}33`,
            }}>
              <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '0.25rem' }}>{alert.title}</p>
              <p style={{ color: colorMap[alert.color], fontSize: '13px', fontWeight: '600', fontFamily: 'monospace' }}>{alert.value}</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// Main App
function App() {
  // Real-time battery data from backend
  const [batteryData, setBatteryData] = useState({
    voltage: 0,
    current: 0,
    temperature: 0,
    soc: 0,
    soh: 0,
    power: 0,
    relayStatus: 'OFF',
    systemStatus: 'Normal',
    timestamp: new Date(),
  });

  const [isConnected, setIsConnected] = useState(false);
  const [time, setTime] = useState(new Date());
  const [timeRange, setTimeRange] = useState('24h');
  const [dataHistory, setDataHistory] = useState([]);
  const [socket, setSocket] = useState(null);

  // Connect to backend WebSocket
  useEffect(() => {
    console.log('🔌 Attempting to connect to backend...');
    
    const socketInstance = io('http://localhost:3001', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketInstance.on('connect', () => {
      console.log('✅ Connected to backend server');
      setIsConnected(true);
    });

    socketInstance.on('battery_data', (data) => {
      console.log('📡 Received data:', data);
      setBatteryData(data);
      
      // Store in history for charts (keep last 50 readings)
      setDataHistory(prev => [...prev.slice(-49), {
        time: new Date(data.timestamp).toLocaleTimeString(),
        voltage: data.voltage,
        current: data.current,
        temperature: data.temperature,
        soc: data.soc,
        soh: data.soh,
        power: data.power,
      }]);
    });

    socketInstance.on('connection_status', (status) => {
      console.log('Status:', status);
      setIsConnected(status.connected);
    });

    socketInstance.on('disconnect', () => {
      console.log('⚠️  Disconnected from backend');
      setIsConnected(false);
    });

    socketInstance.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Generate mock data for charts if no real data yet
  const chartData = dataHistory.length > 0 
    ? dataHistory 
    : generate24HourData();

  const data24h = generate24HourData();
  const data7d = generate7DayData();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
      color: '#fff',
    }}>
      <TopNavBar 
        batteryStatus={batteryData.systemStatus} 
        isConnected={isConnected} 
        time={time} 
      />

      <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
        <BatteryHealthCard 
          percentage={batteryData.soc}
          health={batteryData.soh}
        />

        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '1.5rem' }}>Live Metrics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <MonitorCard 
            title="Voltage" 
            value={batteryData.voltage.toFixed(1)} 
            unit="V" 
            color="blue" 
            data={chartData} 
            dataKey="voltage"
          />
          <MonitorCard 
            title="Current" 
            value={Math.abs(batteryData.current).toFixed(1)} 
            unit="A" 
            color="purple" 
            data={chartData}
            dataKey="current"
          />
          <MonitorCard 
            title="Temperature" 
            value={batteryData.temperature.toFixed(1)} 
            unit="°C" 
            color="green" 
          />
          <MonitorCard 
            title="Power Output" 
            value={(batteryData.power).toFixed(1)} 
            unit="kW" 
            color="blue" 
            data={chartData}
            dataKey="power"
          />
          <MonitorCard 
            title="State of Charge" 
            value={batteryData.soc.toFixed(1)} 
            unit="%" 
            color="green" 
          />
          <MonitorCard 
            title="State of Health" 
            value={batteryData.soh.toFixed(1)} 
            unit="%" 
            color="blue" 
          />
        </div>

        <AlertPanel batteryData={batteryData} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>Data Analytics</h2>
              <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '0.25rem' }}>Historical trends & performance insights</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['24h', '7d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  style={{
                    padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none',
                    background: timeRange === range ? '#00d4ff' : 'rgba(0, 0, 0, 0.3)',
                    color: timeRange === range ? '#000' : '#fff',
                    fontWeight: '600', cursor: 'pointer', fontSize: '14px',
                  }}
                >
                  {range === '24h' ? '24 Hours' : '7 Days'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: '300px', marginBottom: '2rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeRange === '24h' ? data24h : data7d}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey={timeRange === '24h' ? 'time' : 'day'} stroke="#888" style={{ fontSize: '12px' }} />
                <YAxis stroke="#888" style={{ fontSize: '12px' }} />
                <Tooltip contentStyle={{ background: 'rgba(10, 14, 39, 0.95)', border: '1px solid rgba(0, 212, 255, 0.5)', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="soc" stroke="#00d4ff" strokeWidth={2} name="SOC %" isAnimationActive />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1rem',
            padding: '2rem',
            backdropFilter: 'blur(10px)',
          }}
        >
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '1.5rem' }}>System Logs</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
            {generateLogs().map((log, idx) => (
              <div key={idx} style={{
                background: 'rgba(0, 0, 0, 0.3)', borderRadius: '0.5rem', padding: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'white', margin: 0 }}>{log.title}</h4>
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace' }}>{log.timestamp}</span>
                </div>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{log.message}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default App;
