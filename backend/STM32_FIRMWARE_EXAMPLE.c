/**
 * STM32F103C8T6 Firmware Example
 * Sends battery sensor data to backend via UART as JSON
 * 
 * Pin Connections:
 * PA0  - Voltage input (via voltage divider)
 * PA1  - Current input (ACS712 sensor)
 * PA2  - Temperature input (DS18B20)
 * PB12 - Relay output
 * 
 * USART1: PA9 (TX) → USB Adapter RX
 *         PA10 (RX) → USB Adapter TX
 *         Baud: 115200, 8 bits, 1 stop bit, no parity
 */

#include "stm32f10x.h"
#include <stdio.h>
#include <string.h>
#include <math.h>

// Sensor calibration values (adjust based on your sensors)
#define VOLTAGE_SCALE 0.161  // (3.3V / 4096) * 200 (voltage divider ratio)
#define CURRENT_SCALE 0.1851 // ACS712 sensitivity: 185mV per A, scaled for 3.3V ADC
#define CURRENT_OFFSET 1.65  // Mid-point for bidirectional measurement

// Global variables
volatile uint16_t adc_voltage = 0;
volatile uint16_t adc_current = 0;
volatile uint16_t adc_temp = 0;
volatile uint32_t measurement_count = 0;

// Function prototypes
void USART1_Init(void);
void ADC_Init(void);
void GPIO_Config(void);
void NVIC_Config(void);
void USART1_SendChar(char c);
void USART1_SendString(const char* str);
void Delay_ms(uint32_t ms);
void ADC_Start_Conversion(void);
uint16_t Read_ADC(uint8_t channel);
float Get_Voltage(void);
float Get_Current(void);
float Get_Temperature(void);
uint8_t Get_SOC(void);
uint8_t Get_SOH(void);
char* Get_RelayStatus(void);
void Relay_Toggle(void);
void Send_JSON_Data(void);

// Main program
int main(void) {
    SystemInit();
    GPIO_Config();
    USART1_Init();
    ADC_Init();
    NVIC_Config();
    
    USART1_SendString("STM32 Battery Monitor Started\r\n");
    
    while (1) {
        // Read analog inputs
        adc_voltage = Read_ADC(0); // PA0
        adc_current = Read_ADC(1); // PA1
        adc_temp = Read_ADC(2);    // PA2
        
        // Send JSON data every 500ms
        if (measurement_count % 50 == 0) {
            Send_JSON_Data();
        }
        
        measurement_count++;
        Delay_ms(10);
    }
    
    return 0;
}

void GPIO_Config(void) {
    GPIO_InitTypeDef GPIO_InitStructure;
    
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA | RCC_APB2Periph_GPIOB, ENABLE);
    
    // PA9 (USART1_TX)
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_9;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_PP;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOA, &GPIO_InitStructure);
    
    // PA10 (USART1_RX)
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_10;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_IN_FLOATING;
    GPIO_Init(GPIOA, &GPIO_InitStructure);
    
    // PB12 (Relay output)
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_12;
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_Out_PP;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOB, &GPIO_InitStructure);
    
    // PA0, PA1, PA2 (ADC inputs - already in analog mode by default)
}

void USART1_Init(void) {
    USART_InitTypeDef USART_InitStructure;
    
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_USART1, ENABLE);
    
    USART_InitStructure.USART_BaudRate = 115200;
    USART_InitStructure.USART_WordLength = USART_WordLength_8b;
    USART_InitStructure.USART_StopBits = USART_StopBits_1;
    USART_InitStructure.USART_Parity = USART_Parity_No;
    USART_InitStructure.USART_HardwareFlowControl = USART_HardwareFlowControl_None;
    USART_InitStructure.USART_Mode = USART_Mode_Tx | USART_Mode_Rx;
    
    USART_Init(USART1, &USART_InitStructure);
    USART_Cmd(USART1, ENABLE);
}

void ADC_Init(void) {
    ADC_InitTypeDef ADC_InitStructure;
    
    RCC_APB2PeriphClockCmd(RCC_APB2Periph_ADC1, ENABLE);
    
    // Prescaler: PCLK2/6 = 72MHz/6 = 12MHz
    RCC_ADCCLKConfig(RCC_PCLK2_Div6);
    
    ADC_InitStructure.ADC_Mode = ADC_Mode_Independent;
    ADC_InitStructure.ADC_ScanConvMode = DISABLE;
    ADC_InitStructure.ADC_ContinuousConvMode = DISABLE;
    ADC_InitStructure.ADC_ExternalTrigConv = ADC_ExternalTrigConv_None;
    ADC_InitStructure.ADC_DataAlign = ADC_DataAlign_Right;
    ADC_InitStructure.ADC_NbrOfChannel = 1;
    
    ADC_Init(ADC1, &ADC_InitStructure);
    ADC_Cmd(ADC1, ENABLE);
    
    // Calibration
    ADC_ResetCalibration(ADC1);
    while (ADC_GetResetCalibrationStatus(ADC1));
    ADC_StartCalibration(ADC1);
    while (ADC_GetCalibrationStatus(ADC1));
}

uint16_t Read_ADC(uint8_t channel) {
    ADC_RegularChannelConfig(ADC1, channel, 1, ADC_SampleTime_55Cycles5);
    ADC_SoftwareStartConvCmd(ADC1, ENABLE);
    
    while (!ADC_GetFlagStatus(ADC1, ADC_FLAG_EOC));
    ADC_ClearFlag(ADC1, ADC_FLAG_EOC);
    
    return ADC_GetConversionValue(ADC1);
}

float Get_Voltage(void) {
    // Convert ADC value to voltage
    // Assuming voltage divider: Input voltage = 5V max, divided to 3.3V
    // Voltage = (ADC_value / 4096) * 3.3 * (R1+R2)/R2
    // Simplified: Voltage = (ADC_value * 161) / 1000
    return (float)adc_voltage * VOLTAGE_SCALE;
}

float Get_Current(void) {
    // ACS712 sensor: 0A = 1.65V, sensitivity = 185mV/A
    // Current = (Voltage - 1.65V) / 0.185
    float voltage = (float)adc_current * 3.3 / 4096;
    return (voltage - CURRENT_OFFSET) / 0.185;
}

float Get_Temperature(void) {
    // DS18B20 temperature (simplified: linear approximation)
    // Temperature = (ADC_value - offset) * scale
    // Adjust these values based on your calibration
    return ((float)adc_temp - 500) * 0.1;
}

uint8_t Get_SOC(void) {
    // Calculate State of Charge based on voltage
    //假设电池最高电压520V，最低电压350V
    float v = Get_Voltage();
    if (v >= 520) return 100;
    if (v <= 350) return 0;
    return (uint8_t)(((v - 350) / 170) * 100);
}

uint8_t Get_SOH(void) {
    // Calculate State of Health (can be based on cycle count, resistance, etc.)
    // For now, use a simple model based on temperature and current
    float i = fabs(Get_Current());
    float t = Get_Temperature();
    
    uint8_t soh = 100;
    if (i > 100) soh -= 5;  // High current degradation
    if (t > 55) soh -= 10;  // High temp degradation
    if (t < -10) soh -= 5;  // Low temp degradation
    
    return soh > 0 ? soh : 0;
}

char* Get_RelayStatus(void) {
    // Read relay status from PB12
    if (GPIO_ReadOutputDataBit(GPIOB, GPIO_Pin_12)) {
        return "ON";
    } else {
        return "OFF";
    }
}

void Relay_Toggle(void) {
    GPIO_WriteBit(GPIOB, GPIO_Pin_12, 
        !GPIO_ReadOutputDataBit(GPIOB, GPIO_Pin_12));
}

void Send_JSON_Data(void) {
    char buffer[256];
    
    float voltage = Get_Voltage();
    float current = Get_Current();
    float temperature = Get_Temperature();
    uint8_t soc = Get_SOC();
    uint8_t soh = Get_SOH();
    
    // Send JSON in short format for efficiency
    // {"v":428.5,"i":92.3,"t":45.2,"s":82,"h":95,"r":"ON"}
    
    sprintf(buffer, "{\"v\":%.1f,\"i\":%.1f,\"t\":%.1f,\"s\":%d,\"h\":%d,\"r\":\"%s\"}\r\n",
            voltage, current, temperature, soc, soh, Get_RelayStatus());
    
    USART1_SendString(buffer);
}

void USART1_SendChar(char c) {
    USART_SendData(USART1, c);
    while (USART_GetFlagStatus(USART1, USART_FLAG_TXE) == RESET);
}

void USART1_SendString(const char* str) {
    while (*str) {
        USART1_SendChar(*str++);
    }
}

void Delay_ms(uint32_t ms) {
    uint32_t i, j;
    for (i = 0; i < ms; i++)
        for (j = 0; j < 123; j++);
}

void USART1_IRQHandler(void) {
    if (USART_GetITStatus(USART1, USART_IT_RXNE) != RESET) {
        uint8_t data = USART_ReceiveData(USART1);
        
        // Handle received commands
        // {"cmd":"relay","state":"ON"}
        // {"cmd":"alert_ack"}
        
        if (data == '}') {
            // End of JSON command received
            // Parse and handle command here
            Relay_Toggle(); // Example action
        }
        
        USART_ClearITPendingBit(USART1, USART_IT_RXNE);
    }
}
