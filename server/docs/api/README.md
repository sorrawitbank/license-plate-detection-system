# License Plate Detection Server – API Documentation

## Overview

REST API for the License Plate Detection System. It provides:

- **Detection** – run LPR (license plate recognition) on uploaded images or videos
- **Parking logs** – list and persist detection results against registered vehicles in PostgreSQL

**Base information**

- **Base URL:** `http://localhost:8000` (default when running with `uvicorn`; change host/port as needed)
- **Content-Type (JSON endpoints):** `application/json`
- **Content-Type (detection endpoints):** `multipart/form-data`
- **Allowed methods:** `GET`, `POST`
- **CORS:** `http://localhost:5173` is allowed by default

**Environment**

- `DATABASE_URL` – PostgreSQL connection string (required for `/logs` endpoints). See `server/.env.example`.

---

## Contents

- [Authentication](#authentication)
- [General](#general)
- [Detect - `/detect`](#detect---detect)
- [Logs - `/logs`](#logs---logs)

---

## Authentication

This API does **not** require authentication. All endpoints are publicly accessible on the configured host.

If authentication is added later, document the `Authorization` header here.

---

## General

### Root

| Method | Path      | Description                            |
| ------ | --------- | -------------------------------------- |
| GET    | `/`       | Welcome message string                 |
| GET    | `/health` | Health check with status and timestamp |

#### GET /

**Auth**

Not required.

**Success (200)**

Plain text:

```text
Welcome to License Plate Detection Server
```

---

#### GET /health

**Auth**

Not required.

**Success (200)**

```json
{
  "status": "OK",
  "timestamp": "2026-05-22T10:30:00.123456"
}
```

`timestamp` is the server local time when the request was handled.

---

### Error Response (Generic Shape)

Most error responses from FastAPI use a `detail` field:

**Single message (typical for `HTTPException`)**

```json
{
  "detail": "Error message string"
}
```

**Validation errors (422 from Pydantic / request body)**

```json
{
  "detail": [
    {
      "type": "string",
      "loc": ["body", "fieldName"],
      "msg": "Human-readable message",
      "input": {}
    }
  ]
}
```

Common status codes:

- `400` - Validation / bad request (empty upload, invalid form values)
- `404` - No detections found (image/video pipeline)
- `422` - Request body does not match schema
- `500` - Internal server error (often database connection for `/logs`)

Individual endpoints may add more specific rules and messages.

---

### Shared detection result shapes

Detection endpoints return one or more **results** with this general structure:

| Field    | Type           | Description                                                                            |
| -------- | -------------- | -------------------------------------------------------------------------------------- |
| carIndex | number \| null | Index of detected car when `detectCar` is true; otherwise `null`                       |
| car      | object \| null | YOLO car detection (camelCase bbox) or `null`                                          |
| plate    | object \| null | Best license-plate detection for the region, or `null` when plate detection is skipped |
| ocr      | object         | OCR output (see below)                                                                 |
| province | object \| null | Fuzzy-matched Thai province from OCR, or `null`                                        |

**`car` / `plate` object (when present)**

```json
{
  "classId": 0,
  "className": "car" | "license_plate",
  "confidence": 0.95,
  "bbox": {
    "x1": 0.0,
    "y1": 0.0,
    "x2": 0.0,
    "y2": 0.0
  }
}
```

**`ocr` object**

```json
{
  "texts": ["string"],
  "confidences": [0.0]
}
```

`confidences` is parallel to `texts` (same length). OCR uses Thai (`easyocr` with `["th"]`).

**`province` object (when matched)**

```json
{
  "index": 0,
  "provinceId": 1,
  "name": "string"
}
```

`index` is the position in `ocr.texts` that best matched a row in `server/docs/provinces.csv`.

---

## Detect - `/detect`

Endpoints for running detection only. They do **not** write to the database. Use `/logs` to persist results.

### POST /detect/image

Detect cars and/or license plates in an uploaded image and run OCR.

**Auth**

Not required.

**Content-Type**

`multipart/form-data`

**Form fields**

| Field         | Type    | Required | Default | Description                                                  |
| ------------- | ------- | -------- | ------- | ------------------------------------------------------------ |
| image         | file    | yes      | —       | Image file (e.g. JPEG, PNG)                                  |
| detectCar     | boolean | no       | `true`  | Run YOLO car detection; when `true`, OCR runs per car region |
| detectPlate   | boolean | no       | `true`  | Run license-plate YOLO inside each region before OCR         |
| preprocessOcr | boolean | no       | `true`  | Apply OCR preprocessing pipeline before EasyOCR              |

**Success (200)**

```json
{
  "count": 1,
  "results": [
    {
      "carIndex": 0,
      "car": {
        "classId": 2,
        "className": "car",
        "confidence": 0.92,
        "bbox": { "x1": 0.0, "y1": 0.0, "x2": 0.0, "y2": 0.0 }
      },
      "plate": {
        "classId": 0,
        "className": "license_plate",
        "confidence": 0.88,
        "bbox": { "x1": 0.0, "y1": 0.0, "x2": 0.0, "y2": 0.0 }
      },
      "ocr": {
        "texts": ["string"],
        "confidences": [0.0]
      },
      "province": {
        "index": 0,
        "provinceId": 1,
        "name": "string"
      }
    }
  ]
}
```

`count` equals `results.length`. Entries with no OCR text are omitted from `results`.

**Errors**

- `400` - `"Input image is empty."`
- `400` - `"Input image is invalid."` (or other `ValueError` message from the pipeline)
- `404` - `"Car detection could not find any car."` (when `detectCar` is true)
- `404` - `"Car detection found no valid car regions."`
- `404` - `"No valid detections were found for OCR."`

---

### POST /detect/video

Process a video frame-by-frame, track plate centers, and run OCR when a track crosses a configurable line.

**Auth**

Not required.

**Content-Type**

`multipart/form-data`

**Form fields**

| Field           | Type    | Required | Default        | Description                                                   |
| --------------- | ------- | -------- | -------------- | ------------------------------------------------------------- |
| video           | file    | yes      | —              | Video file (written to a temporary `.mp4` for OpenCV)         |
| lineOrientation | string  | no       | `"horizontal"` | `"horizontal"` or `"vertical"` (case-insensitive)             |
| point           | number  | no       | `0.5`          | Normalized line position along the relevant axis, in `[0, 1]` |
| detectCar       | boolean | no       | `true`         | Same as image endpoint                                        |
| preprocessOcr   | boolean | no       | `true`         | Same as image endpoint                                        |

For a **horizontal** line, `point` is the normalized **y** position (0 = top, 1 = bottom). For a **vertical** line, `point` is the normalized **x** position (0 = left, 1 = right).

**Success (200)**

```json
{
  "line": {
    "orientation": "horizontal" | "vertical",
    "normalizedValue": 0.5,
    "pixelValue": 360.0
  },
  "count": 1,
  "results": [
    {
      "trackId": 1,
      "frameIndex": 42,
      "timestampSec": 1.4,
      "direction": 1 | 2,
      "carIndex": 0,
      "car": { },
      "plate": { },
      "ocr": {
        "texts": ["string"],
        "confidences": [0.0]
      },
      "province": {
        "index": 0,
        "provinceId": 1,
        "name": "string"
      }
    }
  ]
}
```

- `direction`: `1` = crossed forward across the line; `2` = crossed backward.
- `timestampSec` = `frameIndex / fps` (falls back to 30 fps if metadata is missing).

**Errors**

- `400` - `"lineOrientation must be either 'horizontal' or 'vertical'."`
- `400` - `"point must be in the range [0, 1]."`
- `400` - `"Input video is empty."`
- `400` - `"Input video is invalid."` (or other `ValueError` from the pipeline)
- `404` - `"No valid detections crossed the configured line for OCR."`

---

## Logs - `/logs`

Endpoints for reading and creating parking log records. They require a working PostgreSQL connection (`DATABASE_URL`).

Log creation accepts detection payloads (typically the `results` array from `/detect/image` or `/detect/video`). The server fuzzy-matches OCR text to registered vehicles, assigns a **status**, and inserts into `parking_logs`.

**Status values** (on create responses):

| Status          | Meaning                                      |
| --------------- | -------------------------------------------- |
| `Tenant`        | Matched vehicle has an assigned parking slot |
| `Former Tenant` | Matched vehicle exists but has no slot       |
| `External`      | No vehicle match above the match threshold   |

---

### GET /logs

List parking logs with optional filters and pagination.

**Auth**

Not required.

**Query parameters**

| Parameter  | Type   | Required | Default | Constraints                                                                     |
| ---------- | ------ | -------- | ------- | ------------------------------------------------------------------------------- |
| keyword    | string | no       | —       | Case-insensitive search on `detected_plate`, tenant `full_name`, or `slot_code` |
| event_type | string | no       | —       | `"IN"` \| `"OUT"` (case-insensitive)                                            |
| page       | int    | no       | `1`     | `>= 1`                                                                          |
| limit      | int    | no       | `10`    | `>= 1`                                                                          |

**Success (200)**

```json
{
  "totalLogs": 100,
  "totalPages": 10,
  "currentPage": 1,
  "limit": 10,
  "logs": [
    {
      "logId": 1,
      "detectedPlate": "string",
      "eventType": "IN" | "OUT",
      "fullName": "string | null",
      "slotId": 1,
      "slotCode": "string | null",
      "confidence": 0.85,
      "detectedAt": "2026-05-22T10:30:00+00:00"
    }
  ]
}
```

Results are ordered by `detectedAt` descending. `fullName` and `slotCode` come from joined tenant/slot tables and may be `null`.

**Errors**

- `500` - `"Server could not read logs because of database connection"`

---

### POST /logs/image

Create one parking log per detection result from an image run.

**Auth**

Not required.

**Body (JSON)**

| Field     | Type   | Required | Constraints                                            |
| --------- | ------ | -------- | ------------------------------------------------------ |
| eventType | string | yes      | `"IN"` \| `"OUT"` (case-insensitive; stored uppercase) |
| results   | array  | yes      | At least one item (see below)                          |

**Each item in `results`**

| Field    | Type   | Required | Description                                                                 |
| -------- | ------ | -------- | --------------------------------------------------------------------------- |
| ocr      | object | yes      | `texts` (array of strings); optional `confidences` (same length as `texts`) |
| province | object | no       | `index` (int), `provinceId` (int) — from detection `province`               |
| plate    | object | no       | Plate detection object (e.g. `confidence`) from detection `plate`           |

Example minimal body (province/plate optional but recommended for matching):

```json
{
  "eventType": "IN",
  "results": [
    {
      "ocr": {
        "texts": ["กก", "1234", "กรุงเทพมหานคร"],
        "confidences": [0.9, 0.85, 0.7]
      },
      "province": {
        "index": 2,
        "provinceId": 1
      },
      "plate": {
        "confidence": 0.88
      }
    }
  ]
}
```

**Success (201)**

```json
{
  "count": 1,
  "entries": [
    {
      "logId": 1,
      "status": "Tenant" | "Former Tenant" | "External",
      "detectedPlate": "string",
      "matchScore": 85.5,
      "detectedAt": "2026-05-22T10:30:00+00:00"
    }
  ]
}
```

`matchScore` is the fuzzy match score against registered vehicles, or `null` when no match.

**Validation errors (422)**

Examples from Pydantic:

- `"results must contain at least one detection"`
- `"ocr.confidences length must match ocr.texts length"`

**Errors**

- `500` - `"Server could not create logs because of database connection"`

---

### POST /logs/video

Create parking logs from video cross-line detection results. Each item carries its own `eventType` (map `direction` from detection to `IN`/`OUT` on the client).

**Auth**

Not required.

**Body (JSON)**

| Field   | Type  | Required | Constraints                   |
| ------- | ----- | -------- | ----------------------------- |
| results | array | yes      | At least one item (see below) |

**Each item in `results`**

| Field        | Type   | Required | Description                    |
| ------------ | ------ | -------- | ------------------------------ |
| trackId      | int    | yes      | From video detection           |
| frameIndex   | int    | yes      | From video detection           |
| timestampSec | number | yes      | From video detection           |
| eventType    | string | yes      | `"IN"` \| `"OUT"` per crossing |
| ocr          | object | yes      | Same as image log item         |
| province     | object | no       | Same as image log item         |
| plate        | object | no       | Same as image log item         |

Example:

```json
{
  "results": [
    {
      "trackId": 1,
      "frameIndex": 42,
      "timestampSec": 1.4,
      "eventType": "IN",
      "ocr": {
        "texts": ["กก", "1234"],
        "confidences": [0.9, 0.85]
      },
      "province": {
        "index": 1,
        "provinceId": 1
      },
      "plate": {
        "confidence": 0.88
      }
    }
  ]
}
```

**Success (201)**

```json
{
  "count": 1,
  "entries": [
    {
      "logId": 1,
      "status": "Tenant",
      "detectedPlate": "string",
      "matchScore": 85.5,
      "detectedAt": "2026-05-22T10:30:00+00:00",
      "trackId": 1,
      "frameIndex": 42,
      "timestampSec": 1.4,
      "eventType": "IN"
    }
  ]
}
```

`detectedAt` is `NOW()` plus `timestampSec` seconds offset in the database insert.

**Validation errors (422)**

Same rules as `POST /logs/image`, plus required fields on each video result item.

**Errors**

- `500` - `"Server could not create logs because of database connection"`

---

## Typical client flow

1. **Detect** – `POST /detect/image` or `POST /detect/video` with the media file.
2. **Review** – Use `results` (OCR, province, plate) in the UI.
3. **Persist** – `POST /logs/image` or `POST /logs/video` with `eventType` / per-item `eventType` and the same `results` shape (subset of fields as documented above).
4. **History** – `GET /logs` with `keyword`, `event_type`, `page`, and `limit`.

Interactive OpenAPI docs are available at `/docs` and `/redoc` when the FastAPI app is running.
