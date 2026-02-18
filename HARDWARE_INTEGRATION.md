# Hardware & Software Integration Guide

## Complete Hardware-to-Dashboard Connection

This guide walks you through connecting your STM32 microcontroller with sensors to the web dashboard.

---

## Part 1: Hardware Wiring

### Required Components
- STM32F103C8T6 (Blue Pill)
- USB-to-UART Adapter (CH340, PL2303, or FT232)
- ACS712 Current Sensor (5A or 30A)
- DS18B20 Temperature Sensor
- Voltage Divider (two resistors)
- Relay Module (optional)
- LEDs + Resistors (optional)

### Pin Connection Diagram

```
STM32F103C8T6 (Top View)
┌─────────────────────────────────────┐
│  VDDA  BOOT0  RST  3.3V  GND  GND   │
│   │      │     │     │    │    │    │
├─┼──┼─────┼─────┼─────┼────┼────┤
│ PB11 PB10 PB1 PB0 PA7 PA6 PA5 PA4  │  ← Top Row
│ PB9  PB8  PB5 PB4 PA3 PA2 PA1 PA0  │  ← Bottom Row
│ PB7  PB6  PA15 PA14 PA13 PA12 PA11 │  ← Bottom (cont)
└─────────────────────────────────────┘
```

### Sensor Connections

#### 1️⃣ **Voltage Input** (PA1 - ADC1)

```
Battery (Positive) ──[R1: 10kΩ]──┬──→ PA1
                                 │
                              [R2: 2.2kΩ]
                                 │
                    Battery (Negative) ──→ GND
```

**Calibration**: Voltage divider ratio = (10k + 2.2k) / 2.2k = 5.54x

#### 2️⃣ **Current Sensor** (PA0 - ADC2)

```
Battery Positive ──→ ACS712 INPUT+
                     ACS712 OUTPUT ──→ PA0
                     ACS712 GND ────→ GND
Battery Negative ──→ Load ──→ Battery Positive
```

**Data**: ACS712-5A outputs 0-5V (2.5V = 0A), sensitivity = 185mV/A

#### 3️⃣ **Temperature Sensor** (PA2)

```
DS18B20 VDD (Red) ───→ 3.3V
DS18B20 DQ (Yellow) ─→ PA2 (with 4.7kΩ pull-up to 3.3V)
DS18B20 GND (Black) ─→ GND
```

#### 4️⃣ **UART Serial** (PA9/PA10)

```
STM32 PA9 (TX)  ──→ USB Adapter RX
STM32 PA10 (RX) ──→ USB Adapter TX
STM32 GND       ──→ USB Adapter GND
USB Adapter 5V (optional, if powering from USB)
```

#### 5️⃣ **Relay Output** (PB12)

```
Relay Module GND  ──→ STM32 GND
Relay Module IN   ──→ PB12
Relay Module VCC  ──→ 5V (external power)
```

---

## Part 2: STM32 Firmware Setup

### Step 1: Prepare Development Environment

**Option A: STM32CubeIDE (Recommended)**
1. Download: https://www.st.com/en/development-tools/stm32cubeide.html
2. Install STM32CubeMX plugins
3. Create new STM32F103 project

**Option B: Keil uVision**
1. Download: https://www.keil.com/demo/eval/arm.htm
2. Install STM32 device pack

### Step 2: Configure STM32CubeIDE Project

1. **New STM32 Project** → Select `STM32F103C8`
2. **Pinout & Configuration**:
   - PA0 → ADC1_IN0 (Current)
   - PA1 → ADC1_IN1 (Voltage)
   - PA2 → ADC1_IN2 (Temperature)
   - PA9 → USART1_TX
   - PA10 → USART1_RX
   - PB12 → GPIO_Output (Relay)

3. **USART Configuration**:
   - Baud Rate: 115200
   - Word Length: 8 bits
   - Stop Bits: 1
   - Parity: None
   - Flow Control: None

4. **ADC Configuration**:
   - Clock: 12 MHz (PCLK2 / 6)
   - Resolution: 12 bits
   - Sampling Time: 55.5 cycles

5. **Generate Code** (CubeMX)

### Step 3: Implement Main Code

Copy firmware from `backend/STM32_FIRMWARE_EXAMPLE.c` to your project's `main.c`:

```c
// Key functions already implemented:
void GPIO_Config(void);      // Initialize pins
void USART1_Init(void);      // Serial at 115200 baud
void ADC_Init(void);         // ADC configuration
void Send_JSON_Data(void);   // Send {"v":...,"i":...,"t":...,"s":...,"h":...,"r":"..."}
float Get_Voltage(void);     // Convert ADC to volts
float Get_Current(void);     // Convert ADC to amps
float Get_Temperature(void); // Convert ADC to °C
uint8_t Get_SOC(void);       // State of Charge calculation
uint8_t Get_SOH(void);       // State of Health calculation
```

### Step 4: Compile & Flash

1. **Compile**: Right-click project → Build
2. **Connect STM32**: USB-to-UART to COM port
3. **Flash**: 
   - Use STM32 ST-LINK Utility
   - Or drag .hex file to STM32 drive
   - Or use IDE's Upload button

4. **Verify**: Open serial monitor at 115200 baud
   - Should see JSON data every 500ms

---

## Part 3: Backend Configuration

### Step 1: Connect USB to Computer

1. Plug **USB-to-UART adapter** into your computer
2. Open **Device Manager** (Win + X → Device Manager)
3. Look under **Ports (COM & LPT)**
4. Find your device (e.g., "USB-SERIAL CH340")
5. Note the **COM port** (e.g., COM3)

### Step 2: Update Backend Configuration

Edit `backend/.env`:

```env
# Find your COM port in Device Manager
SERIAL_PORT=COM3

# Keep this value (STM32 firmware uses 115200 baud)
BAUD_RATE=115200

# Server port
PORT=3001

# Environment
NODE_ENV=development
```

### Step 3: Start Backend Server

```bash
cd backend
npm run dev
```

**Expected Output:**
```
🚀 Backend server running on http://localhost:3001
📊 WebSocket available for real-time data

🔌 Attempting to connect to STM32 on COM3...
✅ Serial connection opened
```

**If you see errors, check:**
- [ ] COM port number is correct
- [ ] USB cable is connected
- [ ] STM32 is powered and has firmware
- [ ] Device Manager shows the port
- [ ] No other application is using the port

---

## Part 4: Frontend Connection

### Start Frontend Dashboard

```bash
cd "Mini project"
npm run dev
```

Dashboard opens at **http://localhost:5173**

### Verify Connection

Check that you see:
- ✅ **WiFi icon is GREEN** (Connected)
- ✅ **Status shows "Normal"** (top right)
- ✅ **Live metrics update** in real-time
- ✅ **Battery gauge moves** smoothly
- ✅ **Alert colors respond** to sensor values

---

## Part 5: Data Flow & Testing

### Expected Data Sequence

```
1. STM32 reads sensors → PA0, PA1, PA2 (ADC)
2. STM32 formats JSON → {"v":428.5,"i":92.3,"t":45.2,"s":82,"h":95,"r":"ON"}
3. STM32 sends serial → UART TX (PA9) @ 115200 baud
4. Backend receives → Serial port listener
5. Backend parses → JSON validator + converter
6. Backend broadcasts → WebSocket (Socket.IO)
7. Frontend receives → Socket.on('battery_data')
8. Frontend renders → Real-time UI update
```

### Serial Monitor Output (Verify STM32)

Open any serial monitor at **115200 baud** on your COM port:

```
STM32 Battery Monitor Started
{"v":428.5,"i":92.3,"t":45.2,"s":82,"h":95,"r":"ON"}
{"v":428.3,"i":92.5,"t":45.3,"s":82,"h":95,"r":"ON"}
{"v":428.1,"i":92.1,"t":45.2,"s":82,"h":95,"r":"ON"}
```

### Backend Console Output (Verify Communication)

```
✅ Serial connection opened
📡 Data received: {
  voltage: 428.5,
  current: 92.3,
  temperature: 45.2,
  soc: 82,
  soh: 95,
  power: 39.5,
  relayStatus: 'ON',
  systemStatus: 'Normal',
  timestamp: 2024-01-15T10:30:45.123Z
}
👤 New client connected: abc123xyz
📡 Data received: { voltage: 428.3, ... }
```

### Dashboard Display (Verify Frontend)

```
Top Bar:
  ✅ Time updates (00:15:32)
  ✅ Status = "Normal" (green)
  ✅ WiFi icon = GREEN

Live Metrics:
  ✅ Voltage: 428.5 V
  ✅ Current: 92.3 A
  ✅ Temperature: 45.2 °C
  ✅ Power: 39.5 kW
  ✅ SOC: 82.0 %
  ✅ SOH: 95.0 %

Battery Health:
  ✅ Circular gauge at 82%
  ✅ Color = GREEN
  ✅ Charts populate

Alerts:
  ✅ Green indicators for all safe readings
  ✅ Colors change if thresholds exceeded
```

---

## Part 6: Troubleshooting

### Issue 1: Backend Says "Cannot Open Serial Port COM3"

**Check:**
```bash
# 1. Is COM port in Device Manager?
#    → If no: USB cable not connected, driver not installed

# 2. Is another app using the port?
#    → Close: Arduino IDE, PuTTY, serial monitors

# 3. Is port name correct?
#    → Device Manager → Ports (COM & LPT) → Right COM?
#    → Update .env: SERIAL_PORT=COM3

# 4. Try a different COM port
#    → Unplug USB, plug into different port
#    → Device Manager → Find new COM port
#    → Update .env again
```

### Issue 2: Dashboard Shows "Disconnected"

**Check:**
```bash
# 1. Is backend running?
#    → See "🚀 Backend server running on http://localhost:3001"?

# 2. Is backend receiving serial data?
#    → See "📡 Data received" in backend console?

# 3. Check browser console (F12)
#    → Any Socket.IO errors?
#    → Check Network tab → WS connection

# 4. Is backend configured correctly?
#    → .env has correct SERIAL_PORT?
```

### Issue 3: Serial Data Not Being Parsed

**Check:**
```bash
# 1. Is STM32 sending data?
#    → Connect serial monitor at COM3, 115200 baud
#    → See JSON strings appearing?

# 2. Is JSON format correct?
#    → Must be: {"v":...,"i":...,"t":...,"s":...,"h":...,"r":"..."}
#    → Must end with \n (newline)

# 3. Is baud rate correct?
#    → STM32 firmware: 115200
#    → .env: BAUD_RATE=115200
#    → Backend: must match
```

### Issue 4: Metrics Not Updating in Real-Time

**Check:**
```bash
# 1. Is WebSocket connected?
#    → Browser F12 → Network → WS tab
#    → Should show socket connection to localhost:3001

# 2. Is backend broadcasting data?
#    → Backend console → io.emit('battery_data', {...})

# 3. Is frontend listening?
#    → Browser console → No Socket.IO errors?
#    → Check App.jsx useEffect hooks

# 4. Check for firewall blocking port 3001
#    → Windows Defender → Allow port 3001
```

---

## Part 7: Sensor Calibration

### Voltage Calibration

1. **Measure actual battery voltage** with multimeter
2. **Note what STM32 shows** for voltage
3. **Calculate correction factor**:
   ```
   VOLTAGE_SCALE = (measured_voltage / adc_reading) * 4096 / 3300
   ```
4. **Update firmware**:
   ```c
   #define VOLTAGE_SCALE 0.161  // Adjust this value
   ```

### Current Sensor Calibration

1. **With no current flowing**:
   - Multimeter on 200mV DC range
   - Measure ACS712 VOUT
   - Should be ~2.5V (mid-point)

2. **With known current** (e.g., 5A):
   - Measure VOUT again
   - Voltage change = current × sensitivity
   - ACS712 sensitivity: 185mV/A

3. **Update firmware**:
   ```c
   float Get_Current(void) {
     float voltage = (float)adc_current * 3.3 / 4096;
     return (voltage - 1.65) / 0.185;  // Adjust offset/sensitivity
   }
   ```

### Temperature Calibration

1. **Place DS18B20 in known temperature** (ice/boiling water)
2. **Note what STM32 shows**
3. **Adjust firmware constants**:
   ```c
   return ((float)adc_temp - offset) * scale;
   ```

---

## Part 8: Testing Commands

### Test STM32 Serial Output

```bash
# Windows: Use Putty or similar
# Set: COM3, 115200 baud, 8 bits, 1 stop, no parity

# Or use Python
python -m serial.tools.list_ports  # Find COM port
python -c "
import serial
ser = serial.Serial('COM3', 115200)
while True:
    print(ser.readline().decode())
"
```

### Test Backend API

```bash
# Get current status
curl http://localhost:3001/api/status

# Toggle relay
curl -X POST http://localhost:3001/api/relay/toggle -H "Content-Type: application/json" -d '{"state":"ON"}'

# Acknowledge alert
curl -X POST http://localhost:3001/api/alert/acknowledge
```

### Test Frontend Connection

```javascript
// Open browser console (F12) and run:
socket.emit('relay_toggle', {state: 'ON'});
socket.emit('alert_acknowledge');
socket.emit('request_status');
```

---

## Part 9: Complete Connection Checklist

Before declaring success, verify:

- [ ] STM32 is connected to USB-to-UART adapter
- [ ] USB adapter is plugged into computer
- [ ] Device Manager shows COM port (no errors)
- [ ] Serial monitor shows JSON data at 115200 baud
- [ ] Backend starts without port errors
- [ ] Backend console shows "Serial connection opened"
- [ ] Backend console shows "📡 Data received" messages
- [ ] Frontend loads at http://localhost:5173
- [ ] Dashboard shows "Connected" (green WiFi)
- [ ] Live metrics update in real-time (~500ms)
- [ ] Battery gauge moves smoothly
- [ ] Alert colors reflect sensor values
- [ ] Status indicator works (Normal/Warning/Critical)

---

## Part 10: Next Steps

Once hardware is connected and verified:

1. **Fine-tune sensor calibration** (voltage/current/temp)
2. **Test relay control** via dashboard
3. **Monitor alert thresholds** and adjust if needed
4. **Log historical data** (optional database)
5. **Deploy to production** (cloud server)
6. **Add mobile app** (React Native/Expo)

---

## Quick Reference: All Connections

| Component | STM32 Pin | Signal | Notes |
|-----------|-----------|--------|-------|
| **Voltage Divider** | PA1 | ADC Input | Via voltage divider circuit |
| **ACS712 Sensor** | PA0 | ADC Input | 0-5V output (2.5V offset) |
| **DS18B20 Sensor** | PA2 | Digital I/O | 1-wire protocol |
| **USB-UART TX** | PA9 | UART TX | @ 115200 baud |
| **USB-UART RX** | PA10 | UART RX | @ 115200 baud |
| **Relay Module** | PB12 | GPIO Output | High = relay ON |
| **GND** | GND | Ground | Common return |

---

## Quick Reference: Port Configuration

```env
# .env file
SERIAL_PORT=COM3         # Change to your port
BAUD_RATE=115200        # Keep this
PORT=3001               # Backend server port
NODE_ENV=development    # Or 'production'
```

---

## Typical Sensor Values

| Sensor | Min | Typical | Max | Unit |
|--------|-----|---------|-----|------|
| Voltage | 300 | 400-430 | 500 | V |
| Current | -100 | 50-100 | 150 | A |
| Temperature | 0 | 25-45 | 80 | °C |
| SOC | 0 | 50-100 | 100 | % |
| SOH | 50 | 90-100 | 100 | % |

---

**Status**: Complete integration guide ready
**Last Updated**: January 2024
**Version**: 1.0
