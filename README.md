# License Plate Detection System

Monorepo for detecting Thai license plates from images and videos, matching results against registered tenants/vehicles, and recording parking IN/OUT events.

The system consists of a **FastAPI backend** (detection + OCR + logs) and a **React web client** (dashboard, detection UI, log history).

## Features

- Car and license-plate detection (YOLO)
- Thai OCR and province fuzzy matching
- Image detection and video line-crossing detection
- Parking log persistence with tenant status (`Tenant`, `Former Tenant`, `External`)
- Searchable, paginated log history in the web UI

## Repository Layout

| Path               | Description                                                         |
| ------------------ | ------------------------------------------------------------------- |
| `client/`          | React + Vite frontend                                               |
| `server/`          | FastAPI backend and LPR pipeline                                    |
| `server/docs/api/` | Full REST API reference                                             |
| `database/`        | PostgreSQL schema (`create.sql`)                                    |
| `data/`            | Sample datasets, and assets                                |
| `notebook/`        | Model training and evaluation notebooks                             |
| `requirements.txt` | Root-level Python deps (optional; prefer `server/requirements.txt`) |

## Tech Stack

**Backend (`server/`)**

- Python, FastAPI, Uvicorn, PostgreSQL, OpenCV, Ultralytics YOLO, EasyOCR

**Frontend (`client/`)**

- React, TypeScript, Vite, Tailwind CSS, DaisyUI, Axios

Details per package:

- [server/README.md](server/README.md)
- [client/README.md](client/README.md)

## Prerequisites

- Node.js 20+ and npm (frontend)
- Python 3.11+ and pip (backend)
- PostgreSQL database
- YOLO model weights under `server/lpr/yolo/`

## Quick Start

### 1) Clone the repository

```bash
git clone <your-repo-url>
cd license-plate-detection-system
```

### 2) Database (for parking logs)

Create a PostgreSQL database and apply the schema:

```bash
psql -U <user> -d <database> -f database/create.sql
```

The script enables `uuid-ossp` automatically; your DB user must be allowed to create extensions.

### 3) Backend

```bash
cd server
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Set `DATABASE_URL` in `server/.env`, then run:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API: `http://localhost:8000` · Docs: `http://localhost:8000/docs`

### 4) Frontend

In a second terminal:

```bash
cd client
npm install
copy .env.example .env
```

Set `VITE_API_BASE_URL=http://localhost:8000` in `client/.env`, then run:

```bash
npm run dev
```

App: `http://localhost:5173`

## Environment Variables

| Package   | File   | Variable            | Purpose                                            |
| --------- | ------ | ------------------- | -------------------------------------------------- |
| `server/` | `.env` | `DATABASE_URL`      | PostgreSQL connection string                       |
| `client/` | `.env` | `VITE_API_BASE_URL` | Backend base URL (default `http://localhost:8000`) |

See `.env.example` in each package for templates.

## Documentation

| Document                                               | Contents                                   |
| ------------------------------------------------------ | ------------------------------------------ |
| [server/docs/api/README.md](server/docs/api/README.md) | Endpoints, request/response shapes, errors |
| [server/README.md](server/README.md)                   | Backend setup, structure, run commands     |
| [client/README.md](client/README.md)                   | Frontend setup, scripts, API integration   |

## Typical Workflow

1. Upload an image or video on the **Detection** page (`POST /detect/*`).
2. Review OCR and province matches in the UI.
3. Save logs with IN/OUT (`POST /logs/*`).
4. Browse history on the **Log** page (`GET /logs`).

Detection endpoints work without a database; log endpoints require PostgreSQL.

## Notes

- Start the **server** before the client so API calls succeed.
- First OCR request may be slow while EasyOCR loads the Thai model.
- `notebook/` is for experimentation and training; not required to run the app.
- No authentication is implemented on the API yet.

## License

This project is licensed under the MIT License. See `LICENSE` for details.
