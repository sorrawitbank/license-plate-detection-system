# License Plate Detection Server

Backend API and LPR pipeline for the License Plate Detection System. This service runs car and license-plate detection, Thai OCR, province matching, and parking log persistence against PostgreSQL.

## Tech Stack

- Python 3.11+ (recommended)
- FastAPI + Uvicorn
- PostgreSQL + asyncpg
- OpenCV (headless)
- Ultralytics YOLO (car and license-plate models)
- EasyOCR (Thai)
- RapidFuzz + Pandas (plate/province matching)

## Prerequisites

- Python 3.11+ (recommended)
- pip
- PostgreSQL database
- YOLO weight files under `lpr/yolo/` (car and license-plate models)

## Project Structure

- `app/main.py` - FastAPI application entry point
- `app/routers/` - HTTP routes (`detect`, `logs`)
- `app/services/` - business logic (logs, vehicles, provinces)
- `app/schemas/` - Pydantic request/response models
- `app/utils/` - database, plate parsing, tenant status helpers
- `lpr/` - detection and OCR pipeline (image, video, YOLO, EasyOCR)
- `docs/api/README.md` - full API contract
- `docs/provinces.csv` - province lookup data for OCR fuzzy matching

## Getting Started

### 1) Clone and install dependencies

```bash
git clone <your-repo-url>
cd license-plate-detection-system/server
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

On macOS/Linux, activate with `source .venv/bin/activate`.

### 2) Configure environment variables

Copy `.env.example` to `.env` and set values.

Required:

- Database: `DATABASE_URL` (PostgreSQL connection string)

### 3) Run in development

From the `server` directory:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Default API base URL:

- `http://localhost:8000`

Interactive docs:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Scripts

This package does not define npm scripts. Typical commands:

- `uvicorn app.main:app --reload` - run API in development
- `uvicorn app.main:app --host 0.0.0.0 --port 8000` - run API on a fixed port

Install dependencies with:

```bash
pip install -r requirements.txt
```

## API Documentation

Detailed API reference is available at:

- `docs/api/README.md`

This document includes endpoint groups, request/response examples, multipart form fields, and error conventions.

## Notes

- CORS allows `http://localhost:5173` by default (Vite client dev server).
- `/detect/*` endpoints do not require a database; `/logs/*` requires `DATABASE_URL` and a reachable PostgreSQL instance.
- First OCR request may be slow while EasyOCR loads the Thai model.
- Detection-only routes return FastAPI `detail` errors; no Bearer token auth is implemented.

## License

This project is licensed under the MIT License. See `LICENSE` for details.
