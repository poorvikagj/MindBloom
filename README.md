# DBMS Project

## Run with Docker

```bash
docker compose up --build
```

The compose stack starts:
- MySQL on `3306`
- the app on `http://localhost:8000`

On first start, MySQL initializes the schema from `schema.sql` and the app container runs `npm run seed` before starting the server.

## Local development

1. Create a MySQL database named `project`.
2. Import `schema.sql`.
3. Set environment variables from `.env.example`.
4. Seed the database.

```bash
npm install
npm run seed
npm start
```

## Environment variables

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `SESSION_SECRET`
- `COOKIE_SECRET`
