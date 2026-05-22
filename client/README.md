# License Plate Detection Client

Web frontend for the License Plate Detection System. This app provides dashboards, image/video detection workflows, and parking log history by calling the backend API.

## Tech Stack

- React 19 + TypeScript
- Vite
- React Router
- Tailwind CSS 4 + DaisyUI
- Axios

## Prerequisites

- Node.js 20+ (recommended)
- npm
- Running backend API (see `../server/README.md`)

## Project Structure

- `src/main.tsx` - application entry point
- `src/App.tsx` - root component
- `src/routes.tsx` - route definitions
- `src/pages/` - page views (Dashboard, Detection, Log)
- `src/features/` - feature UI (detection, parking logs)
- `src/hooks/` - data-fetching and upload hooks
- `src/services/` - Axios client and API modules
- `src/layout/` - navbar, sidebar, main layout
- `src/types/` - shared TypeScript types
- `src/utils/` - helpers (e.g. direction to log event type)

## Getting Started

### 1) Clone and install dependencies

```bash
git clone <your-repo-url>
cd license-plate-detection-system/client
npm install
```

### 2) Configure environment variables

Copy `.env.example` to `.env` and set values.

Required:

- API: `VITE_API_BASE_URL` (backend base URL, no trailing slash)

Example for local development:

```env
VITE_API_BASE_URL=http://localhost:8000
```

If unset, the app defaults to `http://localhost:8000`.

### 3) Run in development

```bash
npm run dev
```

Default frontend URL is usually:

- `http://localhost:5173`

Ensure the server is running and CORS allows this origin.

## Scripts

- `npm run dev` - start Vite dev server
- `npm run build` - type-check and build for production
- `npm run preview` - preview production build locally
- `npm run lint` - run ESLint

## API Documentation

The client consumes the backend API documented at:

- `../server/docs/api/README.md`

Main integrations:

- `POST /detect/image`, `POST /detect/video` - run detection from uploads
- `POST /logs/image`, `POST /logs/video` - persist detection results
- `GET /logs` - list parking logs with search and pagination

## Notes

- Upload flows use `multipart/form-data` for detection endpoints.
- Video log creation maps line-crossing `direction` to `IN`/`OUT` via `src/utils/directionToLogEventType.ts`.
- Production builds embed `VITE_*` variables at build time; restart dev server after changing `.env`.

## License

This project is licensed under the MIT License. See `LICENSE` for details.
