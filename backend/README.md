# EV Battery Monitoring System - Backend Server

This Node.js backend server bridges the STM32 microcontroller with the React dashboard frontend via serial communication and WebSocket real-time updates.

## Features

- **Serial Port Communication**: Reads sensor data from STM32F103C8T6 at 115200 baud
- **Real-time WebSocket Broadcasting**: Sends live battery data to connected dashboard clients
- **Automatic Reconnection**: Attempts to reconnect if serial connection drops
- **REST API**: Additional endpoints for status checks and historical data
- **Status Detection**: Automatically determines system status (Normal/Warning/Critical)
- **Relay Control**: Send commands to control STM32 relay via serial

## Hardware Connection

Connect your STM32 to your computer via USB-to-UART adapter:

```
STM32 PA9  (TX) → UART RX
STM32 PA10 (RX) → UART TX
STM32 GND      → GND
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Find your STM32's COM port:
   - **Windows**: Device Manager → Ports (COM & LPT) → Look for "USB Serial Device" or similar
   - **Linux**: `ls /dev/ttyUSB*` or `ls /dev/ttyACM*`
   - **macOS**: `ls /dev/tty.usbserial*`

3. Update `.env` file with your COM port:
```
SERIAL_PORT=COM3
```

## Running the Server

### Development (with auto-restart on code changes):
```bash
npm run dev
```

### Production:
```bash
npm start
```

The server will start on `http://localhost:3001`

## Data Format

### Expected JSON from STM32:
```json
{
  "v": 428.5,    // Voltage (V)
  "i": 92.3,     // Current (A)
  "t": 45.2,     // Temperature (°C)
  "s": 82,       // State of Charge (%)
  "h": 95,       // State of Health (%)
  "r": "ON"      // Relay Status (ON/OFF)
}
```

### Sent to Dashboard (same data + calculated):
```json
{
  "voltage": 428.5,
  "current": 92.3,
  "temperature": 45.2,
  "soc": 82,
  "soh": 95,
  "power": 39.5,              // Calculated P = V × I
  "relayStatus": "ON",
  "systemStatus": "Normal",   // Normal/Warning/Critical
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

## WebSocket Events

### Server → Client (Broadcasting)
- **battery_data**: Real-time sensor readings
- **connection_status**: Serial port connection status
- **error**: Error messages

### Client → Server (from Dashboard)
- **relay_toggle**: Toggle relay state
- **alert_acknowledge**: Acknowledge system alerts
- **request_status**: Request current status

## REST API Endpoints

### GET `/api/status`
Returns current connection status and latest data
```json
{
  "connected": true,
  "port": "COM3",
  "data": { ...battery_data }
}
```

### GET `/api/history`
Returns historical data (currently returns last reading, expandable with database)

### POST `/api/relay/toggle`
Toggle relay state
```json
{
  "state": "ON" // or "OFF"
}
```

### POST `/api/alert/acknowledge`
Acknowledge system alerts

## STM32 Serial Commands

Send these JSON commands from backend to STM32:

**Toggle Relay:**
```json
{"cmd":"relay","state":"ON"}
```

**Acknowledge Alert:**
```json
{"cmd":"alert_ack"}
```

## System Status Logic

- **Critical**: Voltage < 350V OR Current > 100A OR Temperature > 60°C
- **Warning**: Voltage < 400V OR Current > 90A OR Temperature > 50°C
- **Normal**: All readings within safe limits

## Troubleshooting

### "Serial port COM3 not found"
- Check Device Manager for the correct COM port
- Verify USB cable is properly connected
- Try unplugging and replugging the USB adapter

### "Cannot connect to WebSocket"
- Ensure backend is running on port 3001
- Check that frontend is trying to connect to correct address (localhost:3001)
- Verify no firewall blocking the port

### "No data received from STM32"
- Check serial baud rate is 115200 in STM32 firmware
- Verify JSON format: each message must end with `\n`
- Monitor terminal output to see incoming data

### Port already in use
```bash
# Kill process using port 3001
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/macOS:
lsof -ti:3001 | xargs kill -9
```

## Frontend Integration

The frontend dashboard (React) should connect to the WebSocket at startup:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('battery_data', (data) => {
  // Update dashboard state with new data
});
```

## Architecture

```
STM32F103C8T6 (Serial UART)
        ↓
    USB-to-UART Adapter
        ↓
    Serial Port (COM3)
        ↓
    Node.js Server (server.js)
        ├─ Express REST API
        └─ Socket.IO WebSocket
                ↓
        React Dashboard
        (Real-time updates)
```

## Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL) for historical data
- [ ] Data logging and export (CSV, JSON)
- [ ] Advanced analytics and reporting
- [ ] Multi-device support (multiple STM32s)
- [ ] Alert notification system (email, SMS, push)
- [ ] Mobile app integration
