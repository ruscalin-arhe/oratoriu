# Oratoriu

Pontaj intern: clienți, proiecte, activități, restanțe, profit.

Ultima actualizare: 24 septembrie 2026

## Locații

| Mediu | Cale |
|---|---|
| Local | `/Users/crus/Projects/oratoriu` |
| GitHub | https://github.com/ruscalin-arhe/oratoriu |
| Docs | https://github.com/ruscalin-arhe/oratoriu/blob/main/docs/README.md |
| Vercel production | https://oratoriu.vercel.app |
| Vercel preview | `https://oratoriu-XXXX-ruscalin-6904s-projects.vercel.app` |
| Neon | proiect `Oratoriu`, `eu-central-1` (Frankfurt) |

Colegii folosesc doar production: `https://oratoriu.vercel.app/login`.  
Preview-ul Vercel cere cont Vercel. Nu se trimite.

## Status

În producție, utilizabil intern.

Gata:

- pontaj pe zi: client / proiect / activitate / ore / notă
- ciornă, trimitere, deblocare, corectare
- calendar pe o zi
- nu se salvează ore fără proiect și activitate
- clienți, proiecte, activități
- proiect `—` (fără proiect numit)
- angajați: nume, email, rol, parolă, cost/oră, tarif/oră
- login email + parolă
- meniu admin vs angajat
- restanțe (azi)
- raport lunar: ore, venit, cost, profit
- CSV pentru Sheets
- reminder email (cod există; cron Hobby Vercel nu rulează singur)
- repo privat + Vercel + Neon

Limitări:

- primul load de pontaj e lent (Neon cold start)
- mobil incomplet pe unele pagini
- Deployment Protection trebuie Off pe production
- `.env` nu e în git; secretele sunt în Vercel

## Model de date
Client
  └── Proiect   (inclusiv "—")
        └── Activitate
              └── Pontaj (angajat, zi, minute)

Exemple:

- Haufe / — / training
- GU / — / project management
- GU / Maps / implementare lincuri

Profit (lună):

- cost = ore × cost/h angajat
- venit = ore facturabile × (tarif proiect, altfel tarif angajat)
- profit = venit − cost

Fără tarife, profitul e 0.

## Rulare locală

```bash
cd ~/Projects/oratoriu
npx next dev --port 3000
Pontaj: http://localhost:3000/today
Login: http://localhost:3000/login
Rapoarte: http://localhost:3000/reports
Angajați: http://localhost:3000/people

Variabile .env:DATABASE_URL — Neon pooler + connection_limit=5
AUTH_SECRET
CRON_SECRET
APP_URL
RESEND_API_KEY (opțional)
EMAIL_FROM (opțional)

Env Vercel: DATABASE_URL, AUTH_SECRET, CRON_SECRET, APP_URL
Production + Preview. Type Secret. După schimbare: Redeploy.Acces echipă: Protection Off pe production, parola o pune adminul în Angajați.PlanificareP0 — următorul pas: raport temporalFiltre:de la / până la (input type="date")
angajat (toți / unul)
client
proiect
activitate (opțional)

Rezultat pe interval:ore lucrate: total, pe angajat, pe proiect, pe zi
ore nelucrate: așteptate − lucrate
zile MISSING / DRAFT

Reguli ore nelucrate:așteptate = zile lucrătoare × programul omului
weekend + sărbători RO = 0
concediu (TimeOff) scade din așteptat
nelucrate = max(0, așteptate − lucrate)

API:GET /api/reports?from=YYYY-MM-DD&to=YYYY-MM-DD&userId=&clientId=&projectId=CSV-ul folosește aceleași from / to.P1activități: rename / delete
tarif proiect în UI
restanțe pe interval
Resend pe production
Sheets OAuth
pontaj mobil pe carduri
audit deblocări

P2profit pe interval liber
buget vs consumat
dashboard o pagină

Nu facemClockify
timer start/stop
app nativă
