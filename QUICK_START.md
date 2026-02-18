# Quick Start Guide

## 30-Second Overview

1. **Frontend** (React + Socket.IO) communicates with **Backend** (Node.js + serial port)
2. **Backend** reads STM32 sensor data and broadcasts via WebSocket
3. **Frontend** displays real-time battery metrics on dashboard

## Installation (5 minutes)

### Terminal 1: Frontend
```bash
cd "Mini project"
npm install
npm run dev
# → Dashboard at http://localhost:5173
```

### Terminal 2: Backend
```bash
cd "Mini project/backend"
npm install

# Update COM port in .env file
# SERIAL_PORT=COM3  (change to your STM32 port)

npm run dev
# → Server at http://localhost:3001
```

## How to Find STM32 COM Port

**Windows:**
- Open Device Manager (`Win + X` → Device Manager)
- Look under "Ports (COM & LPT)"
- Find your USB device (e.g., "CH340" or "USB Serial")
- Note the COM number (e.g., COM3)

**Update .env:**
```
SERIAL_PORT=COM3
```

## Expected Flow

```
STM32 (Serial UART)
  ↓ 115200 baud
  ↓ JSON data every 500ms
Backend (Node.js)
  ↓ WebSocket broadcast
  ↓ Real-time updates
Dashboard (React)
  ↓ Display updates
  ↓ Live metrics + alerts
```

## Testing Checklist

- [ ] Frontend runs at http://localhost:5173
- [ ] Backend runs at http://localhost:3001
- [ ] Dashboard shows "Connected" (green WiFi icon)
- [ ] Battery metrics update in real-time
- [ ] Alert colors change based on sensor values
- [ ] Backend console shows incoming data

## STM32 Code Quick Template

```c
// Send JSON from STM32 at 115200 baud
void Send_Data() {
  sprintf(buffer, "{\"v\":%.1f,\"i\":%.1f,\"t\":%.1f,\"s\":%d,\"h\":%d,\"r\":\"ON\"}\r\n",
          voltage, current, temperature, soc, soh);
  USART_SendString(buffer);
}

// Pin assignments
PA0  → Current Sensor
PA1  → Voltage Input
PA2  → Temperature Sensor
PA9  → UART TX
PA10 → UART RX
PB12 → Relay Output
```

## Common Issues

| Issue | Fix |
|-------|-----|
| "Cannot find COM3" | Check Device Manager, update .env |
| "Cannot connect to localhost:3001" | Ensure backend is running |
| Dashboard shows "Disconnected" | Check backend console for errors |
| No data received | Verify STM32 UART output format |
| Port already in use | Kill process on port 3001 |

## File Overview

```
Mini project/
├── src/App.jsx              ← WebSocket connection logic
├── backend/server.js        ← Serial + WebSocket server
├── backend/.env             ← Configuration (COM port)
├── SETUP.md                 ← Full documentation
└── QUICK_START.md           ← This file
```

## Next Steps

1. **Immediate**: Get STM32 hardware communicating with backend
2. **Short-term**: Verify all sensor readings display correctly
3. **Medium-term**: Fine-tune sensor calibration values
4. **Long-term**: Add database, alerts, mobile app

## Key Commands

```bash
# Frontend
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build

# Backend
npm run dev      # Start with auto-reload (nodemon)
npm start        # Start production server
npm install      # Install dependencies
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│         React Dashboard (Port 5173)                 │
│  - Voltage, Current, Temperature displays           │
│  - Battery Health gauge (SOC/SOH)                   │
│  - Alert system (Normal/Warning/Critical)           │
│  - Real-time charts & analytics                     │
└──────────────────┬──────────────────────────────────┘
                   │ WebSocket
                   │ localhost:3001
                   ▼
┌─────────────────────────────────────────────────────┐
│         Node.js Backend (Port 3001)                 │
│  - Serial port listener (STM32 data)                │
│  - JSON parser                                      │
│  - WebSocket broadcaster (Socket.IO)                │
│  - REST API endpoints                               │
└──────────────────┬──────────────────────────────────┘
                   │ UART Serial
                   │ 115200 baud
                   ▼
┌─────────────────────────────────────────────────────┐
│    STM32F103C8T6 + Sensors (Hardware)               │
│  - ACS712 Current Sensor → PA0                      │
│  - Voltage Divider → PA1                            │
│  - DS18B20 Temperature → PA2                        │
│  - Relay/Buzzer outputs                             │
└─────────────────────────────────────────────────────┘
```

## Data Format

**STM32 sends (every 500ms):**
```json
{"v":428.5,"i":92.3,"t":45.2,"s":82,"h":95,"r":"ON"}
```

**Backend processes to:**
```json
{
  "voltage": 428.5,        // V
  "current": 92.3,         // A
  "temperature": 45.2,     // °C
  "soc": 82,              // %
  "soh": 95,              // %
  "power": 39.5,          // kW
  "relayStatus": "ON",
  "systemStatus": "Normal",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

---

**Status**: Ready to run
**Last Updated**: January 2024
**Version**: 1.0
