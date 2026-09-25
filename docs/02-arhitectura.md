# 2. Arhitectură front + back

Monolit Next.js App Router.

- UI: React 19, Next 16, Tailwind 4
- API: src/app/api/**/route.ts
- Auth: cookie oratoriu_email + passwordHash
- DB: Prisma 6 + Neon
- Host: Vercel

Pagini: today, missing, reports, clients, projects, people, login.
Lib: prisma, current-user, require-admin, password, timezone, holidays-ro, capacity.

Flux zi: MISSING -> PUT DRAFT -> POST SUBMITTED.
PUT rescrie toate entries din zi.
