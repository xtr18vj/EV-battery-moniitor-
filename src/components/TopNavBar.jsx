import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Settings, Battery } from 'lucide-react';
import { motion } from 'framer-motion';

export const TopNavBar = ({ batteryStatus = 'Normal', isConnected = true }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const statusBgColors = {
    Normal: { bg: 'rgba(0, 255, 0, 0.2)', border: 'rgba(0, 255, 0, 0.5)', text: '#00ff00' },
    Warning: { bg: 'rgba(255, 255, 0, 0.2)', border: 'rgba(255, 255, 0, 0.5)', text: '#ffff00' },
    Critical: { bg: 'rgba(255, 0, 80, 0.2)', border: 'rgba(255, 0, 80, 0.5)', text: '#ff0050' },
  };

  return (
    <nav className="sticky top-0 z-50" style={{ 
      backdropFilter: 'blur(20px)',
      background: 'rgba(10, 14, 39, 0.7)',
      borderBottom: '1px solid rgba(30, 40, 71, 1)',
    }}>
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{
            background: 'linear-gradient(to bottom right, #00d4ff, #00ff00)',
          }}>
            <Battery className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">EV Monitor</span>
        </motion.div>

        {/* Center - System Status */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2 rounded-full border flex items-center gap-2"
          style={{
            background: statusBgColors[batteryStatus].bg,
            borderColor: statusBgColors[batteryStatus].border,
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full"
            style={{ background: statusBgColors[batteryStatus].text }}
          />
          <span className="text-sm font-semibold" style={{ color: statusBgColors[batteryStatus].text }}>
            {batteryStatus}
          </span>
        </motion.div>

        {/* Right - Status Indicators */}
        <div className="flex items-center gap-6">
          {/* Clock */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-300 font-mono"
          >
            {time.toLocaleTimeString()}
          </motion.div>

          {/* WiFi Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ color: isConnected ? '#00ff00' : '#ff0050' }}
          >
            {isConnected ? (
              <Wifi className="w-5 h-5" />
            ) : (
              <WifiOff className="w-5 h-5" />
            )}
          </motion.div>

          {/* Settings */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg transition-colors text-gray-300"
            style={{ ':hover': { background: 'rgba(30, 40, 71, 1)', color: '#00d4ff' } }}
          >
            <Settings className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </nav>
  );
};
