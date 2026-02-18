import { motion } from 'framer-motion';
import { Zap, Clock } from 'lucide-react';

export const BatteryHealthCard = ({ percentage = 82, health = 95, state = 'Charging', timeRemaining = '3h 45m' }) => {
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine color based on percentage
  const getColor = (value) => {
    if (value >= 80) return '#00ff00'; // Green
    if (value >= 50) return '#00d4ff'; // Blue
    if (value >= 20) return '#ffff00'; // Yellow
    return '#ff0050'; // Red
  };

  const color = getColor(percentage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-1 md:col-span-2 rounded-2xl p-8 relative overflow-hidden group"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Background Gradient */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(to bottom right, rgba(0, 212, 255, 0.1), rgba(0, 255, 0, 0.1))',
        }}
      />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Battery Health</h2>
            <p className="text-gray-400">Real-time monitoring & analytics</p>
          </div>
          <div
            className="px-4 py-2 rounded-lg"
            style={{
              background: 'rgba(0, 255, 0, 0.2)',
              border: '1px solid rgba(0, 255, 0, 0.5)',
            }}
          >
            <span className="font-semibold" style={{ color: '#00ff00' }}>
              {health}%
            </span>
            <p className="text-xs text-gray-400">SOH</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Circular Progress */}
          <div className="flex justify-center">
            <div className="relative w-64 h-64">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 300 300">
                {/* Background Circle */}
                <circle
                  cx="150"
                  cy="150"
                  r={radius}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress Circle */}
                <motion.circle
                  cx="150"
                  cy="150"
                  r={radius}
                  stroke={color}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: 'easeInOut' }}
                  strokeLinecap="round"
                  filter="drop-shadow(0 0 6px currentColor)"
                />
              </svg>

              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <p className="text-5xl font-bold" style={{ color }}>
                    {percentage}%
                  </p>
                  <p className="text-gray-400 text-sm mt-2">State of Charge</p>
                </motion.div>
              </div>
            </div>
          </div>

          {/* State and Time Info */}
          <div className="space-y-6">
            {/* Battery State */}
            <div className="glass-dark rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-2">Battery State</p>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-3 h-3 rounded-full bg-neon-green"
                />
                <span className="text-xl font-semibold text-white">{state}</span>
              </motion.div>
            </div>

            {/* Estimated Time */}
            <div className="glass-dark rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-neon-blue" />
                <p className="text-gray-400 text-sm">Est. Time Remaining</p>
              </div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-neon-blue"
              >
                {timeRemaining}
              </motion.p>
            </div>

            {/* Quick Stats */}
            <div className="glass-dark rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-4">Quick Stats</p>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between text-gray-300">
                  <span>Cycles:</span>
                  <span className="text-neon-blue font-semibold">234</span>
                </p>
                <p className="flex justify-between text-gray-300">
                  <span>Capacity Loss:</span>
                  <span className="text-neon-green font-semibold">5%</span>
                </p>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-4 md:col-span-1">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-dark rounded-xl p-6"
            >
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-neon-blue flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-400 text-sm">Power Output</p>
                  <p className="text-xl font-bold text-neon-blue">42.5 kW</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-dark rounded-xl p-6"
            >
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-400 text-sm">Efficiency</p>
                  <p className="text-xl font-bold text-neon-green">94.2%</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-dark rounded-xl p-6"
            >
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-neon-green flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <p className="text-xl font-bold text-neon-green">Optimal</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
