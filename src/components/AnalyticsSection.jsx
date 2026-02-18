import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Download, TrendingUp } from 'lucide-react';

// Generate sample historical data
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

const generate30DayData = () =>
  Array.from({ length: 30 }, (_, i) => ({
    date: `Day ${i + 1}`,
    soc: 60 + Math.sin(i * 0.2) * 25 + Math.random() * 8,
    efficiency: 90 + Math.random() * 6,
  }));

const ChartCard = ({ title, timeRange, data, type = 'line' }) => {
  const ChartComponent =
    type === 'line' ? LineChart : type === 'area' ? AreaChart : BarChart;
  const DataComponent = type === 'line' ? Line : type === 'area' ? Area : Bar;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 col-span-1"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-lg font-bold text-white">{title}</h4>
          <p className="text-xs text-gray-400 mt-1">{timeRange}</p>
        </div>
        <TrendingUp className="w-5 h-5 text-neon-blue" />
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey={Object.keys(data[0])[0]}
              stroke="#888"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#888" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10, 14, 39, 0.95)',
                border: '1px solid rgba(0, 212, 255, 0.5)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            {type === 'bar' ? (
              <>
                <Bar dataKey="efficiency" fill="#00d4ff" name="Efficiency %" />
                <Bar dataKey="cycles" fill="#00ff00" name="Cycles" />
              </>
            ) : type === 'area' ? (
              <>
                <Area
                  type="monotone"
                  dataKey="soc"
                  fill="#00d4ff30"
                  stroke="#00d4ff"
                  name="SOC %"
                  isAnimationActive={true}
                />
                <Area
                  type="monotone"
                  dataKey="soh"
                  fill="#00ff0030"
                  stroke="#00ff00"
                  name="SOH %"
                  isAnimationActive={true}
                />
              </>
            ) : (
              <>
                <Line
                  type="monotone"
                  dataKey="soc"
                  stroke="#00d4ff"
                  strokeWidth={2}
                  name="SOC %"
                  isAnimationActive={true}
                />
                <Line
                  type="monotone"
                  dataKey="temp"
                  stroke="#ffaa00"
                  strokeWidth={2}
                  name="Temp °C"
                  isAnimationActive={true}
                />
              </>
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export const AnalyticsSection = () => {
  const [timeRange, setTimeRange] = useState('24h');

  const data24h = generate24HourData();
  const data7d = generate7DayData();
  const data30d = generate30DayData();

  const displayData =
    timeRange === '24h' ? data24h : timeRange === '7d' ? data7d : data30d;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Data Analytics</h2>
          <p className="text-gray-400 text-sm mt-1">Historical trends & performance insights</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range Toggle */}
          <div className="flex gap-2 p-1 glass rounded-lg">
            {['24h', '7d', '30d'].map((range) => (
              <motion.button
                key={range}
                onClick={() => setTimeRange(range)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-md transition-all font-semibold text-sm ${
                  timeRange === range
                    ? 'bg-neon-blue text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range === '24h'
                  ? '24 Hours'
                  : range === '7d'
                  ? '7 Days'
                  : '30 Days'}
              </motion.button>
            ))}
          </div>

          {/* Download Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 glass rounded-lg text-neon-blue hover:text-neon-green transition-colors font-semibold"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </motion.button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard
          title="Battery Performance"
          timeRange={
            timeRange === '24h'
              ? 'Last 24 Hours'
              : timeRange === '7d'
              ? 'Last 7 Days'
              : 'Last 30 Days'
          }
          data={displayData}
          type={timeRange === '24h' ? 'area' : 'line'}
        />

        <ChartCard
          title="System Efficiency"
          timeRange={
            timeRange === '24h'
              ? 'Last 24 Hours'
              : timeRange === '7d'
              ? 'Last 7 Days'
              : 'Last 30 Days'
          }
          data={timeRange === '7d' ? data7d : data30d}
          type="bar"
        />
      </div>

      {/* Performance Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-8"
      >
        <h3 className="text-xl font-bold text-white mb-6">Performance Summary</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div whileHover={{ scale: 1.05 }} className="glass-dark rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">Avg Efficiency</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-3xl font-bold text-neon-blue"
            >
              93.8%
            </motion.p>
            <p className="text-xs text-neon-green mt-2">↑ 2.1% from last period</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} className="glass-dark rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">Total Cycles</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-3xl font-bold text-neon-green"
            >
              234
            </motion.p>
            <p className="text-xs text-neon-green mt-2">Healthy degradation rate</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} className="glass-dark rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">Peak Temp</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-3xl font-bold text-yellow-400"
            >
              52.3°C
            </motion.p>
            <p className="text-xs text-gray-400 mt-2">Within safe range</p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} className="glass-dark rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">Avg Power</p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-3xl font-bold text-neon-blue"
            >
              38.5 kW
            </motion.p>
            <p className="text-xs text-neon-blue mt-2">Consistent delivery</p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};
