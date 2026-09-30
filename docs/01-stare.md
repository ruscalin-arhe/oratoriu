# Stare — 30 sept 2026

## Gata

- pontaj zi: proiect (search) / activitate / ore / notă
- ciornă, trimitere, deblocare
- clienți, proiecte, activități; fără proiect duplicat pe același client
- angajați creați de admin; parolă Oratoriu, nu Gmail
- restanțe azi, raport interval, CSV
- ștergere user (cu ore, cascade) și activitate (doar fără ore)
- meniu: pe login doar Schimbă user; /today fără sesiune → /login

## Local vs producție

| Local :3002 | Vercel |
|---|---|
| dropdown client → proiect → activități | poate fi încă tabel (build fail) |
| CSS aerisit | depinde de ultimul deploy verde |

## Blocaj producție

`sortOrder` pe Task nu e în clientul Prisma de pe Vercel.
`next build` pică TS2353. Nu mai împinge sortOrder până e în schema + generate pe CI.
