import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

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

const MonitorCard = ({ title, value, unit, icon: Icon, color, trend, chart: Chart, data, gaugeMax }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-6 relative overflow-hidden group"
    >
      {/* Gradient Background */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br ${
          color === 'blue'
            ? 'from-neon-blue to-neon-blue'
            : color === 'green'
            ? 'from-neon-green to-neon-green'
            : color === 'purple'
            ? 'from-neon-purple to-neon-purple'
            : 'from-neon-red to-neon-red'
        }`}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-gray-400 text-sm mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <motion.span
                key={value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-white"
              >
                {value}
              </motion.span>
              <span className="text-sm text-gray-400">{unit}</span>
            </div>
          </div>
          {trend && (
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <TrendingUp
                className="w-5 h-5"
                style={{
                  color:
                    color === 'blue'
                      ? '#00d4ff'
                      : color === 'green'
                      ? '#00ff00'
                      : color === 'purple'
                      ? '#d946ef'
                      : '#ff0050',
                }}
              />
            </motion.div>
          )}
        </div>

        {/* Chart */}
        {Chart && data && (
          <div className="h-24 -mx-2 -mb-2 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <Chart data={data}>
                {Chart === LineChart ? (
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={
                      color === 'blue'
                        ? '#00d4ff'
                        : color === 'green'
                        ? '#00ff00'
                        : color === 'purple'
                        ? '#d946ef'
                        : '#ff0050'
                    }
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                  />
                ) : (
                  <Area
                    type="monotone"
                    dataKey="value"
                    fill={
                      color === 'blue'
                        ? '#00d4ff30'
                        : color === 'green'
                        ? '#00ff0030'
                        : color === 'purple'
                        ? '#d946ef30'
                        : '#ff005030'
                    }
                    stroke={
                      color === 'blue'
                        ? '#00d4ff'
                        : color === 'green'
                        ? '#00ff00'
                        : color === 'purple'
                        ? '#d946ef'
                        : '#ff0050'
                    }
                    strokeWidth={2}
                    isAnimationActive={true}
                  />
                )}
              </Chart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Status Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2"
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`w-2 h-2 rounded-full ${
              color === 'blue'
                ? 'bg-neon-blue'
                : color === 'green'
                ? 'bg-neon-green'
                : color === 'purple'
                ? 'bg-neon-purple'
                : 'bg-neon-red'
            }`}
          />
          <span className="text-xs text-gray-400">Live Update</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export const LiveMonitoringCards = () => {
  const voltageData = generateVoltageData();
  const currentData = generateCurrentData();
  const powerData = generatePowerData();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {/* Voltage Card */}
      <MonitorCard
        title="Voltage"
        value="428.5"
        unit="V"
        color="blue"
        trend
        chart={LineChart}
        data={voltageData}
      />

      {/* Current Card */}
      <MonitorCard
        title="Current"
        value="92.3"
        unit="A"
        color="purple"
        trend
        chart={AreaChart}
        data={currentData}
      />

      {/* Temperature Card (Gauge-like) */}
      <MonitorCard
        title="Temperature"
        value="45.2"
        unit="°C"
        color="green"
        trend={false}
      />

      {/* Power Card */}
      <MonitorCard
        title="Power Output"
        value="39.5"
        unit="kW"
        color="blue"
        trend
        chart={LineChart}
        data={powerData}
      />

      {/* State of Charge (SOC) */}
      <MonitorCard
        title="State of Charge"
        value="82.1"
        unit="%"
        color="green"
        trend={true}
        chart={AreaChart}
        data={generateVoltageData()}
      />

      {/* State of Health (SOH) */}
      <MonitorCard
        title="State of Health"
        value="95.7"
        unit="%"
        color="blue"
        trend={false}
      />
    </div>
  );
};
