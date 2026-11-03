# PS Faturas

The PS Faturas web application uses the PS-Mobile API (`/api/v1`) for authentication,
account verification, two-factor authentication, workspace selection, products, sales,
and fiscal documents.

## Local development

1. Copy `.env.example` to `.env.local`; it points to the test API at `http://102.37.1.46:8081/api/v1`.
3. Run `npm ci` and `npm run dev`.

The frontend is available at `http://localhost:3000`. The API must allow the frontend
origin in `CORS_ORIGINS`.

For production, set `VITE_PS_MOBILE_API_BASE_URL` to the deployed HTTPS PS-Mobile API
base URL before building, then run `npm run build`. The HTTP VPS URL is only for testing.
