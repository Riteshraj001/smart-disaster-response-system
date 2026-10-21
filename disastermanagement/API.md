# Emergency-response API additions

All response bodies are JSON. Validation failures return `400` with field messages; missing records return `404`; invalid workflow transitions, unavailable resources, and duplicate team names return `409`.

## Teams and members

`POST /api/response-teams`

Request: `{"name":"Fire Unit Alpha","specialization":"Fire suppression","available":true}`

Response (`201`): `{"id":1,"name":"Fire Unit Alpha","specialization":"Fire suppression","available":true,"members":[]}`

`GET /api/response-teams?availableOnly=true`

Response: array of the team response above. Omit `availableOnly` to include unavailable teams.

If this endpoint returns an empty array, no response teams are currently stored. Create a real, authorized team through `POST /api/response-teams` before dispatch; the API persists it and returns its stable database `id`. No default/fake team is inserted automatically.

`POST /api/response-teams/{teamId}/members`

Request: `{"name":"Asha Singh","role":"Incident commander","contactInfo":"+91...","available":true}`

Response (`201`): `{"id":7,"name":"Asha Singh","role":"Incident commander","contactInfo":"+91...","available":true,"teamId":1,"teamName":"Fire Unit Alpha"}`

`GET /api/response-teams/{teamId}/members?availableOnly=true` and `GET /api/response-members?availableOnly=true`

Response: array of member responses above.

## Assignment and workflow

`PUT /api/incidents/{incidentId}/assignment` (also available at `/incidents/{incidentId}/assignment`; the same route performs reassignment)

Request: `{"teamId":1,"memberId":7,"notes":"Nearest crew dispatched","priorityOverrideReason":"Medical crew is already en route"}`. `teamId` is the preferred stable identifier and is returned by `GET /api/response-teams`. For compatibility with existing clients, `teamName` can be sent instead of `teamId`, for example `{"teamName":"Station 1 Fire & Rescue Engine"}`; it must match a persisted response team name (case-insensitive), and the response includes the actual team ID in `currentAssignment`. If both fields are supplied, they must identify the same team. `memberId` is optional, but when supplied it must be an available member of `teamId`. `priorityOverrideReason` is required to assign a HIGH, MEDIUM, or LOW incident while any CRITICAL incident remains unresolved.

Response (`200`): the incident response below. The preceding assignment is retained in history with `active:false` and `unassignedAt`; the new one is `currentAssignment`. A verified incident becomes `ASSIGNED` automatically.

`GET /incidents/{incidentId}/assignments`

Response: `[{"id":3,"teamId":1,"teamName":"Fire Unit Alpha","memberId":7,"memberName":"Asha Singh","assignedAt":"2026-10-10T01:00:00","unassignedAt":null,"notes":"Nearest crew dispatched","priorityOverrideReason":null,"active":true}]`

`GET /incidents/assigned/team/{teamId}` and `GET /incidents/assigned/member/{memberId}`

Response: array of currently assigned incident responses.

`PATCH /api/incidents/{incidentId}/status` (also available at `/incidents/{incidentId}/status`)

Request: `{"status":"VERIFIED"}`. Valid workflow is `PENDING_VERIFICATION` → `VERIFIED` → `ASSIGNED` → `RESPONSE_DISPATCHED` → `RESPONDING` → `RESPONSE_COMPLETED` → `RESOLVED`. `RESPONSE_DISPATCHED` must be reached before `RESPONDING`, and `RESPONSE_COMPLETED` must be reached before `RESOLVED`; direct skips are rejected. Assignment must use the assignment endpoint; manually setting `ASSIGNED` without an active persistent assignment is rejected.

## Incident response fields

Existing `GET /api/incidents` and `POST /api/incidents` (also `/incidents`) are retained. `POST` continues to return `200` for ESP32 compatibility; it accepts the existing incident request fields and always creates a `PENDING_VERIFICATION` incident. `GET` returns stored `severity` and `status` values, ordered by `CRITICAL`, `HIGH`, `MEDIUM`, then `LOW`; within a severity, incidents awaiting action come first, followed by older reports.

`GET /incidents/queue` returns only unresolved work, ordered `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`: `{"unresolvedCriticalCount":1,"unresolvedCriticalIncidents":[...],"incidents":[...]}`. The critical list includes each incident's current `status`, so the frontend must always surface unresolved critical incidents instead of hiding them behind the general queue.

An incident request may additionally include a coordinate pair, for example `{"disasterType":"Fire","location":"North gate","latitude":28.6139,"longitude":77.2090}`. Both fields are optional, but must be provided together. Latitude is `-90..90`; longitude is `-180..180`. A plain `location` string is retained as text and does not create coordinates.

An incident response includes: `id`, `disasterType`, `location`, `description`, `severity`, `source`, `status`, `dispatchState`, `reportedAt`, `updatedAt`, `contactInfo`, `assignedTeam`, `imageUrl`, `deviceId`, `latitude`, `longitude`, and `currentAssignment`. `assignedTeam` remains a legacy display field; `currentAssignment` is the authoritative persistent relationship.

## Phase 2 GPS tracking

The tracking API stores only the latest accepted location for a responder or vehicle. It does not create a GPS history stream. Location timestamps must be ISO-8601 instants, latitude must be `-90..90`, longitude `-180..180`, and accuracy must be non-negative when supplied. Updates older than the stored timestamp are rejected with `409`; updates more frequent than `app.tracking.minimum-update-seconds` are rejected with `429`.

Responder phone credentials are configured on the server, never in source control, using `TRACKING_RESPONDER_TOKENS` with `memberId=token;memberId2=token2`. The token maps to the member server-side; the request cannot choose a member identity. The member must have an active incident assignment.

`POST /api/tracking/responder/location`

Request headers: `Authorization: Bearer <configured-responder-token>`

Request body:

```json
{"latitude":28.6139,"longitude":77.2090,"accuracy":8.4,"timestamp":"2026-10-12T08:00:00Z"}
```

`GET /api/tracking/responder/assignments`, `GET /api/tracking/responder/location`, and `POST /api/tracking/responder/location/stop` use the same bearer token. Stop marks the latest source `OFFLINE`; the browser also clears its geolocation watcher.

Vehicles are configured with `TRACKING_VEHICLE_TOKENS` (`deviceId=token`), `TRACKING_VEHICLE_TEAM_IDS` (`deviceId=teamId`), and optional `TRACKING_VEHICLE_IDENTIFIERS` (`deviceId=vehicle name`). The real device must first register, then an authorized operator assigns the returned vehicle ID through the existing assignment endpoint using `vehicleId`.

`POST /api/tracking/vehicles/register`

Request headers: `Authorization: Bearer <configured-vehicle-token>`

`POST /api/tracking/vehicle/location`, `GET /api/tracking/vehicle/location`, and `POST /api/tracking/vehicle/location/stop` use the same bearer token. Vehicle updates are accepted only for the registered device and an active incident assignment referencing that vehicle.

The assignment request now optionally accepts `vehicleId`. A response assignment includes `vehicleId` and `vehicleIdentifier` when a vehicle is attached.

Citizen tracking uses a server-generated capability token returned only by the `POST /api/incidents` response as `trackingToken`. The frontend stores that token for the reporting browser and calls:

`GET /api/tracking/incidents/{incidentId}` with `X-Incident-Tracking-Token: <trackingToken>`

This protected response may include `responderLocation` with `sourceType` (`RESPONDER_PHONE` or `VEHICLE`), coordinates, accuracy, timestamp, team name, and `ONLINE`/`STALE`/`OFFLINE` status. The normal public incident response does not include responder location.

## Automatic responder dispatch

Verification remains required. When an incident transitions from `PENDING_VERIFICATION` to `VERIFIED`, the backend creates one or more `OFFERED` records for available members of available response teams. Candidates with real latest responder coordinates are ranked by straight-line distance; no fake position or ETA is generated. Road travel time is reserved for a future routing integration.

The incident response includes `dispatchState`: `WAITING_FOR_VERIFICATION`, `WAITING_FOR_PRIORITY`, `OFFERED`, `WAITING_FOR_RESPONDER`, `ACCEPTED`, or `ESCALATED`. An offer is not an assignment. Acceptance creates the persistent active assignment and changes the incident to `ASSIGNED`; competing acceptance attempts are rejected transactionally. Lower-severity incidents remain waiting while an unresolved critical incident has priority, preserving the existing override policy.

`GET /api/tracking/responder/offers` returns offers addressed to the bearer-token responder. `POST /api/tracking/responder/offers/{offerId}/accept` accepts one offer. `POST /api/tracking/responder/offers/{offerId}/decline` declines it and may accept `{"reason":"Already responding elsewhere"}`. Expired or declined offers cause the next eligible candidate to be offered when available. Critical incidents with no eligible candidate enter `ESCALATED` and require operational intervention.

Dispatch configuration is server-side:

```text
DISPATCH_OFFER_TIMEOUT_SECONDS=120
DISPATCH_OFFER_BATCH_SIZE=1
```

An operational responder must exist in `team_members`, belong to an available `response_teams` row, and have a configured token such as `TRACKING_RESPONDER_TOKENS=memberId=secret`. The current prototype has no separate identity-provider login; the bearer token is the backend authorization boundary and must be provisioned out-of-band.

## IoT telemetry (ESP32 readings)

The backend now stores real telemetry readings in MySQL and exposes a dedicated telemetry API under `/api/telemetry`. The server intentionally does not create duplicate incidents from each telemetry packet; the ESP32 firmware and existing `/api/incidents` flow remain the authoritative trigger path for creating formal incidents.

Device status is computed from the actual `lastSeen` timestamp:
- `ONLINE`: last telemetry arrived within the last 60 seconds
- `STALE`: last telemetry arrived between 60 and 180 seconds ago
- `OFFLINE`: last telemetry is older than 180 seconds

The default values are configured in `application.properties` as `app.iot.online-timeout-seconds=60` and `app.iot.offline-timeout-seconds=180`.

### `POST /api/telemetry`

Request body (JSON):

```json
{
  "deviceId": "ESP32-001",
  "timestamp": "2026-10-10T08:34:12.131+05:30",
  "temperature": 29.4,
  "humidity": 61.5,
  "mq2Raw": 412,
  "flameDetected": false,
  "accelerationX": 0.12,
  "accelerationY": -0.08,
  "accelerationZ": 0.97,
  "source": "ESP32"
}
```

`timestamp` may also be sent as Unix epoch milliseconds in a JSON number, for example `1728453452131`, or as ISO-8601 text. The `mq2Raw` field matches the raw MQ-2 ADC value; `flameDetected` is a boolean flame-state flag; `accelerationX/Y/Z` contain the available MPU6050 measurements when they are present.

Response (`201 Created`):

```json
{
  "deviceId": "ESP32-001",
  "timestamp": "2026-10-10T08:34:12.131",
  "timestampIso": "2026-10-10T08:34:12.131",
  "temperature": 29.4,
  "humidity": 61.5,
  "mq2Raw": 412,
  "flameDetected": false,
  "accelerationX": 0.12,
  "accelerationY": -0.08,
  "accelerationZ": 0.97,
  "vibrationMagnitude": 1.02,
  "source": "ESP32"
}
```

Validation: the request fails with `400 Bad Request` when `deviceId` is missing or blank, or when numeric readings fall outside the supported ranges (`temperature -100..100`, `humidity 0..100`, `mq2Raw 0..4095`, accelerometer values ±20). The controller uses `@Valid` and the global exception handler returns the field-specific errors.

### `GET /api/telemetry/latest`

Returns the newest telemetry packet for each discovered device.

Example response:

```json
[
  {
    "deviceId": "ESP32-001",
    "deviceName": "ESP32-001",
    "status": "ONLINE",
    "lastSeen": "2026-10-10T08:34:12.131",
    "lastSeenEpochMs": 1728453452131,
    "location": "Unassigned",
    "latestReading": {
      "deviceId": "ESP32-001",
      "timestamp": "2026-10-10T08:34:12.131",
      "timestampIso": "2026-10-10T08:34:12.131",
      "temperature": 29.4,
      "humidity": 61.5,
      "mq2Raw": 412,
      "flameDetected": false,
      "accelerationX": 0.12,
      "accelerationY": -0.08,
      "accelerationZ": 0.97,
      "vibrationMagnitude": 1.02,
      "source": "ESP32"
    }
  }
]
```

### `GET /api/telemetry/history`

Query params:
- `deviceId` optional, filters by a single device ID
- `start` optional, ISO-8601 or epoch string (`2026-10-10T00:00:00` or `1728453452131`)
- `end` optional, same format
- `page` optional, zero-based paging index, default `0`
- `limit` optional, max `200`, default `50`

Example:

`GET /api/telemetry/history?deviceId=ESP32-001&page=0&limit=25`

Response:

```json
{
  "readings": [
    {
      "deviceId": "ESP32-001",
      "timestamp": "2026-10-10T08:34:12.131",
      "timestampIso": "2026-10-10T08:34:12.131",
      "temperature": 29.4,
      "humidity": 61.5,
      "mq2Raw": 412,
      "flameDetected": false,
      "accelerationX": 0.12,
      "accelerationY": -0.08,
      "accelerationZ": 0.97,
      "vibrationMagnitude": 1.02,
      "source": "ESP32"
    }
  ],
  "page": 0,
  "limit": 25,
  "totalElements": 1,
  "totalPages": 1
}
```

### `GET /api/telemetry/devices`

Returns all registered devices with their computed status, last-seen timestamp, and newest reading. This endpoint is suitable for the Admin IoT Monitoring dashboard.

Example:

```json
[
  {
    "deviceId": "ESP32-001",
    "deviceName": "ESP32-001",
    "status": "ONLINE",
    "lastSeen": "2026-10-10T08:34:12.131",
    "lastSeenEpochMs": 1728453452131,
    "location": "Unassigned",
    "latestReading": {
      "deviceId": "ESP32-001",
      "temperature": 29.4,
      "humidity": 61.5,
      "mq2Raw": 412,
      "flameDetected": false,
      "accelerationX": 0.12,
      "accelerationY": -0.08,
      "accelerationZ": 0.97,
      "vibrationMagnitude": 1.02,
      "source": "ESP32"
    }
  }
]
```

The device list does not mark a device online without recent telemetry. If there has been no reading for longer than the configured offline window, the API returns `OFFLINE` instead of a false online state.
