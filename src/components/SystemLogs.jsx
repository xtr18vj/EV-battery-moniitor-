import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, Clock } from 'lucide-react';

const generateLogs = () => [
  { id: 1, timestamp: '14:32:15', type: 'success', title: 'Battery fully charged', message: 'SOC reached 100% - Charging complete' },
  { id: 2, timestamp: '14:25:42', type: 'info', title: 'Charging initiated', message: 'Charging started at 25.5kW power level' },
  { id: 3, timestamp: '14:18:09', type: 'success', title: 'Temperature normalized', message: 'Battery temp returned to safe range (45°C)' },
  { id: 4, timestamp: '14:10:33', type: 'warning', title: 'High temperature warning', message: 'Battery temperature exceeded 50°C threshold' },
  { id: 5, timestamp: '14:05:21', type: 'info', title: 'System initialized', message: 'All sensors and protection systems active' },
  { id: 6, timestamp: '14:00:00', type: 'success', title: 'Connection established', message: 'WebSocket connection to monitoring server established' },
];

const LogItem = ({ log, index }) => {
  const IconMap = {
    success: CheckCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const ColorMap = {
    success: { bg: 'bg-neon-green/10', border: 'border-neon-green/30', icon: 'text-neon-green' },
    warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: 'text-yellow-400' },
    info: { bg: 'bg-neon-blue/10', border: 'border-neon-blue/30', icon: 'text-neon-blue' },
  };

  const Icon = IconMap[log.type];
  const colors = ColorMap[log.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ x: 4 }}
      className={`glass-dark rounded-lg p-4 border ${colors.border} ${colors.bg} group cursor-pointer transition-all hover:shadow-lg`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
          className="flex-shrink-0"
        >
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-semibold text-white">{log.title}</h4>
            <motion.span
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-xs text-gray-500 font-mono flex-shrink-0"
            >
              {log.timestamp}
            </motion.span>
          </div>
          <p className="text-xs text-gray-400 line-clamp-2">{log.message}</p>
        </div>
      </div>
    </motion.div>
  );
};

export const SystemLogs = () => {
  const [logs, setLogs] = useState(() => generateLogs());
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState(new Set());

  // Simulate live logs
  useEffect(() => {
    if (!autoScroll) return;

    const interval = setInterval(() => {
      const newLog = {
        id: Math.random(),
        timestamp: new Date().toLocaleTimeString(),
        type: ['success', 'info', 'warning'][Math.floor(Math.random() * 3)],
        title: ['System check passed', 'Data sync complete', 'Temperature warning'][Math.floor(Math.random() * 3)],
        message: ['All systems operational', 'Live data updated successfully', 'Monitor temperature levels'][Math.floor(Math.random() * 3)],
      };

      setLogs((prev) => [newLog, ...prev].slice(0, 50));
    }, 8000);

    return () => clearInterval(interval);
  }, [autoScroll]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-neon-blue" />
            System Logs
          </h2>
          <p className="text-gray-400 text-sm mt-1">Live event history & monitoring</p>
        </div>

        {/* Controls */}
        <motion.button
          onClick={() => setAutoScroll(!autoScroll)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            autoScroll
              ? 'bg-neon-green/20 border border-neon-green/50 text-neon-green'
              : 'bg-gray-500/20 border border-gray-500/50 text-gray-400'
          }`}
        >
          {autoScroll ? '⚫ Live' : '⭕ Paused'}
        </motion.button>
      </div>

      {/* Logs Container */}
      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-neon-blue/40 scrollbar-track-dark-card">
        <AnimatePresence mode="popLayout">
          {logs.map((log, idx) => (
            <LogItem key={log.id} log={log} index={idx} />
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {logs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-gray-400">No logs yet. Waiting for events...</p>
          </motion.div>
        )}
      </div>

      {/* Footer Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="border-t border-white/10 mt-6 pt-6 grid grid-cols-3 gap-4"
      >
        <div className="glass-dark rounded-lg p-4 text-center">
          <p className="text-gray-400 text-xs mb-2">Total Events</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-bold text-neon-blue"
          >
            {logs.length}
          </motion.p>
        </div>
        <div className="glass-dark rounded-lg p-4 text-center">
          <p className="text-gray-400 text-xs mb-2">Last Update</p>
          <motion.p
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-lg font-bold text-neon-green"
          >
            Just now
          </motion.p>
        </div>
        <div className="glass-dark rounded-lg p-4 text-center">
          <p className="text-gray-400 text-xs mb-2">Uptime</p>
          <p className="text-2xl font-bold text-neon-purple">45d 12h</p>
        </div>
      </motion.div>
    </motion.div>
  );
};
