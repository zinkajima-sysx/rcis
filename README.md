This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Environment Setup

1. Copy `.env.example` to `.env.local`
2. Fill in your Neon, Cloudinary, and app settings
3. For Vercel deployment, add the same keys in `Project Settings -> Environment Variables`

Important:

- `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `SESSION_SECRET`, and `CLOUDINARY_API_SECRET` must stay server-side only
- Only variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Image files should be stored in Cloudinary, while metadata and business data should be stored in Neon

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment Notes

- Repository / source code: GitHub
- Frontend hosting: Vercel
- Database: Neon Postgres
- File storage: Cloudinary

Before deploying, make sure `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SITE_URL` use your production domain.

### Vercel Setup

1. Import the GitHub repository into Vercel
2. Set the project root directory to `web`
3. Add the required environment variables from `.env.example`
4. Redeploy after secrets or URLs change

For local development with Vercel-linked env vars:

```bash
vercel link
vercel env pull .env.local
```
