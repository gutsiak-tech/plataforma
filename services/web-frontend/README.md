# Web Frontend (React + Vite + TS)

This frontend now uses a modern DX stack:

- TanStack Query (data cache / retries / invalidation)
- Zod (runtime-safe API parsing)
- Tailwind token-based dark UI
- shadcn-style UI primitives with Radix components
- Apache ECharts for dashboard charts
- TanStack Table + react-virtual for large tables
- MSW optional mocks for backend-free UI development

## Environment

Create `.env` from `.env.example`.

Key variables:

- `VITE_API_BASE_URL` (preferred)
- `VITE_API_URL` (backward compatible)
- `VITE_TILES_URL`
- `VITE_MSW=1` to enable mock service worker
- `VITE_TREEMAP_MOCK=1` to force treemap mock rendering

## Scripts

- `npm run dev` - normal development mode (real backend)
- `npm run dev:msw` - runs frontend with MSW enabled (`VITE_MSW=1`)
- `npm run build` - production build

## MSW Notes

- Worker file is generated at `public/mockServiceWorker.js`.
- Mock handlers live in `src/mocks/handlers.ts`.
- In dev, mocks activate only when `VITE_MSW=1`.
