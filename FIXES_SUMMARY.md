# Fixes Applied

## 1. Environment loading fixed
- Added `import "dotenv/config";` in `server.ts` so `.env` values load locally.
- Changed fixed port `3000` to `Number(process.env.PORT) || 3000`.

## 2. Secrets protected
- Added `.env.example`.
- Real `.env` should not be committed or shared.
- The updated zip excludes real `.env` and `node_modules`.

## 3. Database fallback fixed
- PostgreSQL/Supabase remains the primary source.
- If cloud DB read/write fails, the app now safely falls back to local `db.json`.
- Writes to `db.json` are atomic using a temp file then rename.

## 4. Settings persistence fixed
- Added `GET /api/settings` and `PUT /api/settings`.
- Updated `SettingsView.tsx` to load and save settings through the backend.
- Added `settings.json` for local persistence.

## 5. ID and code generation improved
- Replaced `Math.random()` IDs with `crypto.randomUUID()` based IDs.
- Replaced length-based codes with max-existing-number generation.
- This avoids duplicate codes after deletion.

## 6. Stock safety improved
- `updateStockBalance()` now throws an error if stock would become negative.
- Previously it silently changed negative stock to zero.

## 7. Smart Entry made safer
- Added one backend endpoint: `POST /api/smart-entry`.
- Updated `SmartEntryView.tsx` to call this endpoint instead of creating records through multiple separate requests.
- Publisher, subject, category, class, book, stock entry, stock balance, stock history, and logs are now saved in one backend flow.

## 8. Database schema strengthened
- Added unique constraints for important business numbers/codes.
- Added Drizzle foreign-key references for book, location, publisher, sales, returns, transfers, and stock-related tables.

## 9. Build verified
- `npm run lint` passed.
- `npm run build` passed after reinstalling optional dependencies with `npm install --include=optional`.

## 10. Useful DB scripts added
- `npm run db:generate`
- `npm run db:push`
- `npm run db:studio`

## Important next step
Run this after extracting the updated project:

```bash
npm install
cp .env.example .env
npm run lint
npm run build
npm run dev
```

Then add your real database values inside `.env`.
