const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const SerialPort = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Configuration
const SERIAL_PORT = process.env.SERIAL_PORT || 'COM3'; // Change to your STM32 COM port
const BAUD_RATE = 115200;
const SERVER_PORT = process.env.PORT || 3001;

// Global variables
let serialPort;
let isConnected = false;
let currentData = {
  voltage: 0,
  current: 0,
  temperature: 0,
  soc: 0, // State of Charge
  soh: 0, // State of Health
  power: 0,
  relayStatus: 'OFF',
  systemStatus: 'Normal',
  timestamp: new Date()
};

// Initialize Serial Connection
function initSerialConnection() {
  console.log(`🔌 Attempting to connect to STM32 on ${SERIAL_PORT}...`);

  serialPort = new SerialPort.SerialPort({
    path: SERIAL_PORT,
    baudRate: BAUD_RATE,
    dataBits: 8,
    stopBits: 1,
    parity: 'none'
  });

  const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

  serialPort.on('open', () => {
    console.log('✅ Serial connection opened');
    isConnected = true;
    io.emit('connection_status', { connected: true, port: SERIAL_PORT });
  });

  // Parse incoming data from STM32
  parser.on('data', (data) => {
    try {
      // Remove any whitespace and parse JSON
      const jsonData = JSON.parse(data.trim());
      
      // Map STM32 data to our format
      currentData = {
        voltage: jsonData.v || jsonData.voltage || 0,
        current: jsonData.i || jsonData.current || 0,
        temperature: jsonData.t || jsonData.temp || jsonData.temperature || 0,
        soc: jsonData.s || jsonData.soc || 0,
        soh: jsonData.h || jsonData.soh || 0,
        power: (jsonData.v || 0) * (jsonData.i || 0) / 1000, // Calculate power
        relayStatus: jsonData.r || jsonData.relay || 'OFF',
        systemStatus: determineStatus(jsonData),
        timestamp: new Date()
      };

      console.log(`📡 Data received:`, currentData);
      
      // Broadcast to all connected clients
      io.emit('battery_data', currentData);
      
    } catch (error) {
      console.error('❌ Error parsing JSON from STM32:', data, error.message);
    }
  });

  serialPort.on('error', (error) => {
    console.error('❌ Serial port error:', error.message);
    isConnected = false;
    io.emit('connection_status', { connected: false, error: error.message });
  });

  serialPort.on('close', () => {
    console.log('⚠️  Serial port closed');
    isConnected = false;
    io.emit('connection_status', { connected: false });
    
    // Attempt to reconnect after 5 seconds
    setTimeout(() => {
      console.log('🔄 Attempting to reconnect...');
      initSerialConnection();
    }, 5000);
  });
}

// Determine system status based on readings
function determineStatus(data) {
  const voltage = data.v || 0;
  const current = data.i || 0;
  const temperature = data.t || 0;

  if (voltage < 350 || current > 100 || temperature > 60) {
    return 'Critical';
  } else if (voltage < 400 || current > 90 || temperature > 50) {
    return 'Warning';
  }
  return 'Normal';
}

// REST API Endpoints
app.get('/api/status', (req, res) => {
  res.json({
    connected: isConnected,
    port: SERIAL_PORT,
    data: currentData
  });
});

app.get('/api/history', (req, res) => {
  // Return last 100 data points (you can enhance this with database)
  res.json({
    history: [currentData], // In production, query from database
    timestamp: new Date()
  });
});

app.post('/api/relay/toggle', (req, res) => {
  const command = req.body.state || 'TOGGLE';
  
  // Send command to STM32 via serial
  if (serialPort && serialPort.isOpen) {
    serialPort.write(`{"cmd":"relay","state":"${command}"}\n`, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to send command' });
      }
      res.json({ success: true, command, relayStatus: command });
    });
  } else {
    res.status(503).json({ error: 'Serial port not connected' });
  }
});

app.post('/api/alert/acknowledge', (req, res) => {
  // Send alert acknowledge command to STM32
  if (serialPort && serialPort.isOpen) {
    serialPort.write('{"cmd":"alert_ack"}\n', (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to acknowledge alert' });
      }
      res.json({ success: true });
    });
  } else {
    res.status(503).json({ error: 'Serial port not connected' });
  }
});

// WebSocket Events
io.on('connection', (socket) => {
  console.log(`👤 New client connected: ${socket.id}`);
  
  // Send current data immediately
  socket.emit('battery_data', currentData);
  socket.emit('connection_status', { connected: isConnected });

  socket.on('disconnect', () => {
    console.log(`👤 Client disconnected: ${socket.id}`);
  });

  // Client requests relay toggle
  socket.on('relay_toggle', (data) => {
    if (serialPort && serialPort.isOpen) {
      const command = `{"cmd":"relay","state":"${data.state}"}\n`;
      serialPort.write(command, (err) => {
        if (err) {
          socket.emit('error', { message: 'Failed to send relay command' });
        }
      });
    }
  });

  // Client requests alert acknowledge
  socket.on('alert_acknowledge', (data) => {
    if (serialPort && serialPort.isOpen) {
      serialPort.write('{"cmd":"alert_ack"}\n', (err) => {
        if (err) {
          socket.emit('error', { message: 'Failed to acknowledge alert' });
        }
      });
    }
  });

  // Client requests status update
  socket.on('request_status', () => {
    socket.emit('battery_data', currentData);
  });
});

// Start server
server.listen(SERVER_PORT, () => {
  console.log(`\n🚀 Backend server running on http://localhost:${SERVER_PORT}`);
  console.log(`📊 WebSocket available for real-time data\n`);
  
  // Initialize serial connection
  initSerialConnection();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (serialPort && serialPort.isOpen) {
    serialPort.close();
  }
  process.exit(0);
});
