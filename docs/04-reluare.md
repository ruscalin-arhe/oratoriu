# 4. Reluare development

cd /Users/crus/Projects/oratoriu
npx next dev --port 3000

Env: DATABASE_URL, AUTH_SECRET, CRON_SECRET, APP_URL, optional RESEND, optional DEV_USER_EMAIL.

npx prisma generate
npx prisma migrate status
npx tsx prisma/seed.ts

Capcane: fara cookie = nimeni nu e logat; zi SUBMITTED blocata; workDate prin toWorkDate.
