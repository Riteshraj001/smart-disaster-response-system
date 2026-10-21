Smart Disaster Management & Emergency Response System

An IoT-based disaster monitoring and emergency response platform that combines environmental sensors, a Spring Boot REST API, a MySQL database, and a React web application to help detect potential hazards and coordinate incident response.

Project status: Academic prototype under development. Core sensor and incident-management workflows have been implemented, while GPS tracking, route display, and ETA functionality still require thorough end-to-end testing. This project is not a certified life-safety system.

Overview

The Smart Disaster Management & Emergency Response System aims to improve how potential disasters are monitored and how emergency incidents are reported, reviewed, and handled.

An ESP32 collects data from connected sensors and sends telemetry to the backend. The backend processes incoming readings and stores relevant incident data in MySQL. The web application provides separate interfaces for citizens, authorities, and responders to support incident reporting and response coordination.

Key objectives

Monitor environmental conditions using IoT sensors.

Send sensor telemetry to a backend through REST APIs.

Generate incident records when configured sensor conditions are triggered.

Allow citizens to report incidents through a web interface.

Allow authorities to review and verify reported incidents.

Support responder dispatch and acceptance workflows.

Develop GPS-based responder tracking and map-based navigation.

Features

IoT-based monitoring

ESP32 DevKit V1 / ESP32-WROOM-32 microcontroller.

Flame detection.

Temperature and humidity monitoring.

MQ-2 gas/smoke sensor readings.

MPU6050 motion and acceleration readings.

Sensor telemetry sent to the Spring Boot backend.

Backend threshold evaluation for automatic incident creation.

Important: MQ-2 readings are raw sensor values in the current prototype, not calibrated gas concentrations in ppm. Motion readings from the MPU6050 alone do not constitute a validated earthquake detection system.

Incident management

Citizen-submitted incident reports.

Authority review and verification workflow.

Incident data stored in MySQL.

Automatic incident record creation when configured sensor conditions are met.

Support for coordinating incident response through the web application.

Responder coordination

Responder dispatch and acceptance workflow.

GPS-based responder selection is intended to identify the nearest available responder.

Map-based responder location display, route information, and ETA are part of the implementation but have not yet been fully tested end to end.

GPS accuracy, location update frequency, nearest-responder selection, route calculations, and ETA reliability must be verified before these capabilities are considered dependable.

System architecture

┌──────────────────────────────┐
│        IoT Hardware          │
│ ESP32 + Connected Sensors    │
└──────────────┬───────────────┘
               │ Sensor telemetry
               ▼
┌──────────────────────────────┐
│    Spring Boot REST API      │
│ Telemetry + Incident Logic   │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│          MySQL               │
│ Incident and Related Data    │
└──────────────┬───────────────┘
               │ REST API
               ▼
┌──────────────────────────────┐
│       React + Vite           │
│ Citizen / Authority /        │
│ Responder Interfaces         │
└──────────────────────────────┘

The diagram represents the intended application flow. Exact endpoint names, database tables, and individual service responsibilities depend on the current implementation.

Technology stack

Component

Technology

Microcontroller

ESP32 DevKit V1 / ESP32-WROOM-32

Sensors

Flame sensor, DHT11, MQ-2, MPU6050

Frontend

React, Vite, JavaScript

Backend

Java, Spring Boot

API communication

REST APIs, HTTP/JSON

Database

MySQL

Hardware programming

ESP32-compatible firmware

Development and testing

Arduino-compatible tooling, Postman, browser developer tools

Hardware configuration

The following table documents the prototype's planned/current pin configuration. Verify it against your actual wiring before assembling or modifying the hardware.

Component

ESP32 GPIO

Flame sensor digital output

GPIO 27

DHT11 data

GPIO 16

MQ-2 analog output

GPIO 34

MPU6050 SDA

GPIO 21

MPU6050 SCL

GPIO 22

Red LED

GPIO 25

Hardware note: Confirm the voltage and output-level requirements of each module. In particular, ensure that sensor outputs connected to ESP32 pins stay within the ESP32's supported input voltage range.

Repository structure

The project is organized into frontend, backend, and hardware/firmware components.

smart-disaster-response-system/
├── disaster-response-frontend/
│   └── React + Vite application
├── disastermanagement/
│   └── Spring Boot backend
├── esp32-firmware/
│   └── ESP32 firmware files (if included)
└── README.md

The esp32-firmware/ directory is a suggested location for firmware. Adjust this tree to match the actual files committed to your repository.

Prerequisites

Install the tools required for the components you want to run:

Git

Java Development Kit compatible with the backend's build configuration

Maven, or the project's Maven Wrapper if included

Node.js and npm

MySQL Server

Arduino IDE or another compatible ESP32 development environment

ESP32 board and the required sensors for hardware testing

Postman or an equivalent API testing tool (optional but useful)

Getting started

1. Clone the repository

git clone https://github.com/Riteshraj001/smart-disaster-response-system.git
cd smart-disaster-response-system

2. Configure MySQL

Start MySQL and create a database for the application:

CREATE DATABASE disaster_management;

Configure the backend database connection using your local MySQL username, password, and database settings.

Example configuration for application.properties:

spring.datasource.url=${DB_URL:jdbc:mysql://localhost:3306/disaster_management}
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD}

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

Adapt these settings to your existing backend configuration and installed MySQL driver.

Security: Do not commit real database passwords, API keys, or other secrets. For production, use managed secrets and an appropriate database migration strategy rather than relying on automatic schema updates.

3. Run the Spring Boot backend

Open a terminal:

cd disastermanagement

If the project includes Maven Wrapper scripts, use the appropriate command for your operating system.

macOS/Linux:

./mvnw spring-boot:run

Windows:

mvnw.cmd spring-boot:run

Alternatively, if Maven is installed:

mvn spring-boot:run

The backend is expected to run on port 8080 if that is the port configured in the application.

If the port is already in use, stop the conflicting process or configure a different port.

4. Run the React frontend

Open another terminal:

cd disaster-response-frontend
npm install
npm run dev

Vite commonly serves the frontend at:

http://localhost:5173

Use the URL printed in the terminal if the port differs.

If the frontend requires a backend base URL, configure it according to the variable name used in your source code. For a Vite application, environment variables exposed to frontend code generally use the VITE_ prefix. Do not assume a particular variable name without checking the project.

5. Configure and run the ESP32

Open the firmware in your ESP32 development environment.

Install any required sensor libraries.

Select the appropriate ESP32 board and serial port.

Configure Wi-Fi credentials and the backend telemetry URL.

Verify that the ESP32 and development computer can communicate over the network.

Upload the firmware and open the serial monitor.

Confirm that sensor readings are being collected.

Verify that telemetry reaches the backend and that the backend processes it correctly.

The backend address configured in the firmware must be reachable from the ESP32. Do not use localhost as the backend hostname in firmware running on a separate device: there, localhost refers to the device itself.

For local development, browser geolocation also requires an appropriate secure context. localhost is generally treated as secure, while a site accessed through a plain HTTP LAN address may not be. Production deployments should use HTTPS.

Telemetry and incident workflow

The prototype uses sensor telemetry containing fields such as:

{
  "deviceId": "ESP32-001",
  "temperature": 30.0,
  "humidity": 65.0,
  "mq2Raw": 420,
  "flameDetected": false,
  "accelerationX": 0.1,
  "accelerationY": 0.2,
  "accelerationZ": 9.7,
  "source": "ESP32"
}

This is an illustrative payload. Use the exact field names, data types, and units accepted by your current firmware and backend.

The intended sensor-driven workflow is:

The ESP32 collects readings from the connected sensors.

The firmware sends telemetry to the backend.

The backend evaluates the readings against configured thresholds.

When a configured condition is triggered, the backend creates an incident record in MySQL.

An authority can review and verify the incident.

The responder workflow can be used to coordinate a response.

The configured thresholds are not documented here because their exact values and validation have not been established in this README.

GPS tracking and route status

GPS-based responder coordination is an important part of the project, but it still needs further testing.

The intended workflow is to obtain responder coordinates, identify an eligible nearby responder, support dispatch and acceptance, and show responder location and route information to the citizen where appropriate.

Before describing this as reliable real-time tracking, test the following:

Browser location permission and coordinate accuracy.

Location updates while the responder moves.

Handling of unavailable, stale, or inaccurate coordinates.

Selection of the nearest available responder.

Dispatch acceptance, rejection, timeout, and reassignment.

Whether the citizen's map updates without a manual refresh.

Whether route and ETA values come from a working routing service and update correctly.

Authorization and privacy rules for sharing responder locations.

Until these checks pass, consider GPS tracking, live map updates, routing, and ETA partially implemented and not fully verified.

Testing checklist

Use this checklist to document actual results before describing a feature as fully tested.

ESP32 connects successfully and reports sensor readings.

Telemetry reaches the correct backend endpoint.

Backend validates and processes telemetry correctly.

Incident creation is verified in MySQL.

Citizen incident reporting works end to end.

Authorities can review and verify incidents.

Dispatch offers are sent to the intended responder.

Responder acceptance updates the incident/assignment correctly.

GPS permissions and location retrieval work reliably.

Responder location updates are visible to the citizen.

Nearest available responder selection is verified with multiple responders.

Map route and ETA are tested against known journeys.

Error handling works when GPS, network access, or the routing service is unavailable.

Access controls prevent unauthorized users from viewing or changing protected information.

Only mark a test complete after verifying the behavior in the running application.

Current limitations

Sensor readings require calibration and validation before real-world safety use.

MQ-2 raw ADC values must not be presented as certified gas concentrations.

MPU6050 acceleration data alone cannot reliably classify earthquakes.

GPS accuracy depends on the device, browser permissions, network conditions, and location source.

Route and ETA accuracy depend on the routing implementation and available mapping data.

Network interruptions and unavailable responders require robust failure handling.

Authentication, authorization, rate limiting, and production security must be reviewed before public deployment.

The system has not been certified or validated for emergency-critical use.

Future improvements

Add calibrated sensor processing and documented threshold configuration.

Improve incident classification and duplicate-incident handling.

Add comprehensive authentication and role-based authorization.

Implement robust location freshness checks and responder reassignment.

Complete end-to-end GPS, map, routing, and ETA validation.

Add audit logs, structured logging, monitoring, and automated tests.

Improve network reliability and secure device-to-server communication.

Deploy the frontend and backend over HTTPS with secure secret management.

Evaluate the system through controlled simulations and documented test scenarios.

Author

Ritesh Raj
B.Tech, Computer Science and Engineering
VIT Chennai — Class of 2028

Project Role: Individual Developer

GitHub: Riteshraj001

LinkedIn: Ritesh Raj

Disclaimer

This project is an academic prototype intended for learning, demonstration, and further development. It must not be relied upon as the sole means of detecting disasters, dispatching emergency services, or protecting human life. Any real-world deployment would require extensive testing, sensor calibration, security review, reliability engineering, and appropriate validation.
