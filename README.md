<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/f0eec020-609a-4e11-97dc-86afa833d90f

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the required app environment variables in [.env.local](.env.local)
   Minimal wajib:
   `DATABASE_URL` untuk koneksi Neon/Postgres dan `JWT_SECRET` acak minimal 32 karakter untuk login.
3. Run the app:
   `npm run dev`

## Verifikasi Data Live

Untuk memastikan angka dashboard benar-benar berasal dari database live:

`npm run verify:dashboard`
