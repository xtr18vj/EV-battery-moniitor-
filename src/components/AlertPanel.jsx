import { motion } from 'framer-motion';
import { AlertTriangle, Zap, Thermometer, Radio, Volume2 } from 'lucide-react';

const AlertItem = ({ icon: Icon, title, status, value, color = 'green' }) => {
  const statusColors = {
    green: { bg: 'bg-neon-green/20', border: 'border-neon-green/50', text: 'text-neon-green' },
    yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400' },
    red: { bg: 'bg-neon-red/20', border: 'border-neon-red/50', text: 'text-neon-red' },
  };

  const colors = statusColors[color];

  return (
    <motion.div
      whileHover={{ scale: 1.02, x: 4 }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`glass-dark rounded-xl p-4 border ${colors.border} ${colors.bg} group cursor-pointer`}
    >
      <div className="flex items-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </motion.div>

        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className={`text-xs ${colors.text} font-mono`}>{value}</p>
        </div>

        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`w-3 h-3 rounded-full ${colors.text}`}
        />
      </div>
    </motion.div>
  );
};

export const AlertPanel = () => {
  const alerts = [
    {
      icon: AlertTriangle,
      title: 'Overvoltage Protection',
      value: 'Normal (428/450V)',
      color: 'green',
      status: 'OK',
    },
    {
      icon: Zap,
      title: 'Overcurrent Detection',
      value: 'Normal (92/120A)',
      color: 'green',
      status: 'OK',
    },
    {
      icon: Thermometer,
      title: 'Temperature Monitor',
      value: 'Normal (45/65°C)',
      color: 'green',
      status: 'OK',
    },
    {
      icon: Radio,
      title: 'Relay Status',
      value: 'Connected',
      color: 'green',
      status: 'ON',
    },
    {
      icon: Volume2,
      title: 'Buzzer Status',
      value: 'Ready',
      color: 'green',
      status: 'ARMED',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-8 mb-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-neon-green" />
            Alert & Protection System
          </h3>
          <p className="text-sm text-gray-400 mt-1">Real-time safety monitoring</p>
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-full border-2 border-neon-green/30 border-t-neon-green flex items-center justify-center"
        >
          <div className="w-2 h-2 rounded-full bg-neon-green" />
        </motion.div>
      </div>

      {/* Alert Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {alerts.map((alert, idx) => (
          <AlertItem key={idx} {...alert} />
        ))}
      </div>

      {/* System Health Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="border-t border-white/10 pt-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-dark rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-2">Total Alerts</p>
            <p className="text-2xl font-bold text-neon-green">0</p>
          </div>
          <div className="glass-dark rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-2">System Health</p>
            <motion.p
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-2xl font-bold text-neon-blue"
            >
              98%
            </motion.p>
          </div>
          <div className="glass-dark rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-2">Last Alert</p>
            <p className="text-xl font-bold text-gray-300">None</p>
          </div>
          <div className="glass-dark rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-2">Status</p>
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-neon-green"
              />
              <p className="text-xl font-bold text-neon-green">Normal</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
