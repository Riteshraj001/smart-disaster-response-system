# Smart Disaster Management & Emergency Response System

An IoT-powered disaster monitoring and emergency response platform designed to detect potential hazards, manage incident reports, coordinate emergency responders, and provide GPS-based response tracking.

## Overview

The Smart Disaster Management & Emergency Response System integrates IoT sensors, a web-based monitoring platform, a REST API backend, and a relational database to support faster incident awareness and coordinated emergency response.

The system collects environmental and motion-related readings from an ESP32-based sensor unit. Sensor telemetry can be sent to a Spring Boot backend for monitoring and potential hazard detection. Citizens can report incidents through a web portal, while authorized emergency personnel can review incidents, coordinate dispatch, and share their location during an active assignment.

The platform is designed as a modular prototype that can be extended for campus safety, industrial facilities, institutional buildings, and other monitored environments.

## Key Features

### 1. IoT-Based Hazard Monitoring
- ESP32-based sensor integration.
- Flame detection using a digital flame sensor.
- Temperature and humidity monitoring using DHT11.
- Gas/smoke-related readings using an MQ-2 sensor.
- Motion and acceleration measurements using an MPU6050.
- Periodic sensor telemetry transmission to the backend.
- Device identification for sensor-source tracking.

### 2. Citizen Emergency Portal
- Submit emergency incident reports.
- View submitted incidents and their status.
- Access incident tracking through the citizen interface.
- Monitor response progress where tracking data is available.

### 3. Authority and Administration Portal
- Review reported incidents.
- Verify incidents before dispatch.
- Monitor incident status and response progress.
- Coordinate responder assignment and dispatch.
- Access incident records through a centralized interface.

### 4. Responder Dispatch Workflow
- Present dispatch offers to designated responders.
- Allow responders to accept an offer before it becomes an active assignment.
- Associate active assignments with the appropriate incident.
- Support responder coordination through the authority portal.

### 5. GPS-Based Responder Tracking
- Browser-based geolocation for authorized responders.
- Explicit consent before sharing device location.
- Location updates during eligible active assignments.
- Citizen-facing tracking when valid incident tracking information is available.
- Map and route integration, with ETA dependent on valid location data and routing-service availability.

### 6. REST API and Database
- Spring Boot backend.
- RESTful communication between the frontend and backend.
- MySQL persistence.
- Structured incident and telemetry data handling.
- Separate frontend and backend applications.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, JavaScript |
| Backend | Java, Spring Boot |
| API | REST |
| Database | MySQL |
| IoT controller | ESP32 DevKit V1 / ESP32-WROOM-32 |
| Flame sensor | Digital flame sensor |
| Temperature and humidity | DHT11 |
| Gas/smoke sensor | MQ-2 |
| Motion sensor | MPU6050 |
| Maps | Leaflet, where configured |
| Location | Browser Geolocation API |
| Development tools | VS Code, Git, GitHub, Postman |

## System Architecture

```text
ESP32 + Sensors
       |
       | HTTP telemetry
       v
Spring Boot REST API <------ React Web Frontend
       |                     /       |       \
       v                    /        |        \
    MySQL              Citizen    Authority  Responder
       |                  Portal     Portal     GPS
       |
       v
Incident and telemetry data
       |
       v
Verification -> Dispatch -> Acceptance
       |
       v
Active assignment -> GPS updates
       |
       v
Citizen tracking and response monitoring
```

The frontend, backend, and IoT device communicate through defined interfaces. The backend is responsible for validating requests and coordinating persistent application data.

## Hardware Configuration

The following pin assignments are used in the current prototype.

| Component | ESP32 connection |
|---|---|
| Flame sensor digital output | GPIO 27 |
| DHT11 data | GPIO 16 |
| MQ-2 analog output | GPIO 34 |
| MPU6050 SDA | GPIO 21 |
| MPU6050 SCL | GPIO 22 |
| Red LED | GPIO 25 |

**Hardware safety:** Confirm each sensor module's voltage requirements and output levels before connecting it to the ESP32. Do not connect a 5 V signal directly to an ESP32 GPIO unless the interface is confirmed safe. MQ-2 readings require calibration and must not be treated as certified gas concentration measurements.

## Prerequisites

Install the following before running the project:

- Git
- Java JDK compatible with the backend's configured Spring Boot version
- Maven, or use the included Maven wrapper if available
- Node.js and npm
- MySQL Server
- Arduino IDE or PlatformIO for ESP32 firmware
- A modern browser such as Chrome
- Postman or another HTTP client for API testing

Check your installations:

```bash
java -version
node -v
npm -v
git --version
mysql --version
```

## Installation and Setup

### Step 1: Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/smart-disaster-response-system.git
cd smart-disaster-response-system
```

Replace `YOUR_USERNAME` with your GitHub username.

The project currently uses this local folder structure:

```text
project software/
├── disaster-response-frontend/
└── disastermanagement/
```

### Step 2: Configure MySQL

Start MySQL and create a database:

```sql
CREATE DATABASE disaster_management;
```

Configure the database connection in the backend's `application.properties` or `application.yml`.

Example configuration:

```properties
spring.datasource.url=${DB_URL:jdbc:mysql://localhost:3306/disaster_management}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
```

Set the database username and password using environment variables. Adjust the driver, dialect, and other properties to match the existing backend configuration.

**Production note:** `ddl-auto=update` is convenient for development. Use version-controlled database migrations and an appropriate schema-validation strategy for production.

### Step 3: Start the backend

Open a terminal:

```bash
cd disastermanagement
```

If the Maven wrapper is present on macOS/Linux:

```bash
./mvnw spring-boot:run
```

Otherwise, use Maven:

```bash
mvn spring-boot:run
```

The backend is expected to start on port `8080`, unless configured otherwise.

Verify that the application starts without database or port errors. Test the existing API endpoints using Postman or the browser where appropriate.

### Step 4: Start the frontend

Open a second terminal:

```bash
cd disaster-response-frontend
npm install
```

Configure the frontend API base URL using the project's existing environment-variable convention. For a Vite application, this may be:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Use the variable name actually read by the current frontend code. Do not introduce a new variable without updating the API client to use it.

Start the development server:

```bash
npm run dev
```

Open the local URL printed by Vite, commonly:

```text
http://localhost:5173
```

Keep the frontend and backend running in separate terminals.

### Step 5: Configure the ESP32

1. Open the ESP32 firmware in Arduino IDE or PlatformIO.
2. Install the libraries required by the firmware, including the appropriate DHT and MPU6050 libraries.
3. Configure the Wi-Fi credentials through a private local configuration file or environment-specific build settings.
4. Set the backend's reachable host address and telemetry endpoint.
5. Select the correct ESP32 board and serial port.
6. Upload the firmware and open the serial monitor.
7. Confirm that sensor readings are being produced and telemetry requests are reaching the backend.

Do not commit Wi-Fi passwords, API secrets, or other credentials to GitHub. The ESP32 must use the host address reachable from its network; `localhost` on the ESP32 refers to the device itself, not your computer.

### Step 6: Test the end-to-end workflow

Use the following checklist:

- [ ] Backend starts successfully.
- [ ] MySQL connection works.
- [ ] Frontend loads and connects to the backend.
- [ ] Citizen can submit an incident.
- [ ] Authority can view and verify the incident.
- [ ] Dispatch offer is created for the intended responder.
- [ ] Responder can accept the offer.
- [ ] Browser location permission and user consent are handled correctly.
- [ ] Valid GPS updates reach the backend.
- [ ] Citizen tracking displays available incident and responder data.
- [ ] Routing and ETA appear only when the necessary location and routing data are available.
- [ ] ESP32 telemetry reaches the configured endpoint.

The precise endpoint paths, authentication requirements, and available workflows should be verified against the implementation in the repository.

## Environment Variables

Use a private `.env` file or your deployment platform's secret manager for local configuration. For example:

```env
DB_URL=jdbc:mysql://localhost:3306/disaster_management
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password
```

The backend must explicitly read these variables, and the frontend must use its configured Vite environment-variable convention. Never put database passwords or production secrets in frontend environment variables: frontend variables are exposed to browser users when bundled.

Add local environment files and firmware credential files to `.gitignore`. Commit a sanitized `.env.example` containing placeholders only.

## Production Deployment Considerations

This repository describes a development-oriented prototype. A production deployment requires additional engineering and validation.

### Security
- Implement proper authentication and role-based authorization.
- Validate all incoming requests.
- Protect dispatch, incident, and GPS endpoints from unauthorized access.
- Use HTTPS for browser location access from non-localhost devices.
- Store secrets outside source control.
- Apply rate limiting, audit logging, and appropriate CORS policies.

### Reliability
- Add health checks, structured logging, monitoring, and alerting.
- Handle device disconnections, delayed telemetry, and duplicate messages.
- Add retry policies and controlled failure handling.
- Use database migrations and tested backup/restore procedures.
- Define retention and deletion policies for location and incident data.

### Location and Dispatch
- Obtain informed responder consent for location sharing.
- Share location only for authorized, active assignments.
- Validate location freshness and accuracy.
- Use a real road-routing service for routes and ETA.
- Handle unavailable GPS, denied permissions, and routing-service outages.
- Do not fabricate responder positions or ETA values.

### Sensor Validation and Emergency Safety
- Calibrate sensors under controlled conditions.
- Validate detection thresholds through documented testing.
- Distinguish sensor readings from confirmed emergencies.
- Provide human verification and escalation procedures.
- Test false-positive and false-negative scenarios.
- Do not use this prototype as the sole basis for life-safety decisions.

### Scalability
- Define a device provisioning and identity strategy.
- Use authenticated device communication.
- Consider message queuing or a telemetry ingestion service at larger scale.
- Use real-time messaging such as WebSockets or server-sent events where required.
- Load-test APIs, maps, databases, and concurrent GPS updates.

## Current Limitations

- Sensor readings are prototype-level and require calibration.
- MQ-2 raw ADC values are not certified gas concentration values.
- MPU6050 acceleration alone is not a certified earthquake detection system.
- Browser GPS accuracy depends on the device, operating system, and available location services.
- Maps, road routes, and ETA depend on configured external services and valid coordinates.
- Actual dispatch automation, authentication, fault tolerance, and deployment readiness must be verified against the implemented code before operational use.

## Future Enhancements

- Multi-building and multi-device monitoring.
- Configurable hazard thresholds and incident correlation.
- Automated incident creation with human verification.
- Nearest-available responder selection using real location and routing data.
- Multi-unit dispatch and assignment management.
- WebSocket-based live updates.
- SMS or push notifications.
- Device health monitoring and offline alerts.
- Role-based access control and audit trails.
- Docker-based deployment, CI/CD, and automated testing.

## Contributing

Contributions are welcome. Before submitting changes:

1. Create a feature branch.
2. Keep secrets and personal data out of commits.
3. Test frontend and backend changes.
4. Document new configuration requirements.
5. Submit a pull request with a clear description.

## Disclaimer

This project is intended for educational, research, and prototype development. It is not a certified emergency dispatch, fire detection, gas detection, or earthquake warning system. Operational deployment requires appropriate engineering validation, security review, hardware certification where applicable, and coordination with qualified emergency-response authorities.

## Author

**Project:** Smart Disaster Management & Emergency Response System  
**Focus:** IoT, full-stack development, emergency incident coordination, and GPS-based responder tracking

Add your name, academic affiliation, and contact links here if you want them included in the public repository.
