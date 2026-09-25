# Oratoriu

Pontaj intern: clienți, proiecte, activități, restanțe, profit.

Ultima actualizare: 25 septembrie 2026

Vezi și: [01-stare](./01-stare.md) · [02-arhitectură](./02-arhitectura.md) · [03-de-făcut](./03-de-facut.md) · [04-reluare](./04-reluare.md) · [05-model](./05-model-date.md) · [06-api](./06-api.md)

## Locații

| Mediu | Cale |
|---|---|
| Local | `/Users/crus/Projects/oratoriu` |
| GitHub | https://github.com/ruscalin-arhe/oratoriu |
| Docs | https://github.com/ruscalin-arhe/oratoriu/blob/main/docs/README.md |
| Vercel production | https://oratoriu.vercel.app |
| Neon | proiect `Oratoriu`, `eu-central-1` |

Colegii: doar `https://oratoriu.vercel.app/login`.

## Status scurt

Producție = MVP 24 sept. Local = rapoarte from/to, concediu interval, UI people/projects compact, login fără middleware. Neîmpins.

Auth: cookie `oratoriu_email`. Nu next-auth.

## Rulare

cd /Users/crus/Projects/oratoriu
npx next dev --port 3000

.env: DATABASE_URL (pooler), AUTH_SECRET, CRON_SECRET, APP_URL.
