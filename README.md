# Anything Questionnaire

Personal questionnaire engine. See `GLOSSARY.md` for the domain vocabulary and `docs/adr/` for decisions.

## Layout

- `packages/engine`: domain logic, independent of any framework (clean architecture: `domain`, `application`, `infrastructure`).
- `packages/app`: TanStack Start app; server functions only delegate to the engine.
- `packages/ui`: design system and screens (Storybook).

Code, identifiers and comments are in English. Only text shown to the user is pt-BR.

## Run everything (Docker)

```sh
cp .env.example .env   # set ANTHROPIC_API_KEY
docker compose up --build
```

The app is exposed on `http://localhost:3000` only (bound to 127.0.0.1). Database migrations run automatically on the first request the app handles. Data lives in the `db-data` volume and Source files in `sources-data`.

## Tests

The engine tests run against a real Postgres, creating one throwaway database per test and dropping it afterwards. Start the database first:

```sh
docker compose up -d db
pnpm test
```

Override the admin connection with `TEST_ADMIN_DATABASE_URL` if needed.

## Other commands

- `pnpm typecheck`: typecheck every package.
- `pnpm --filter @anything-questionnaire/engine db:generate`: generate a migration after changing the schema.
- `pnpm --filter @anything-questionnaire/ui storybook`: Storybook on port 6006.
