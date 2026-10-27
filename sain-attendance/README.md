# Sain Ирц — attendance lookup

Employees type their code, pick a month, and see only their own attendance.
An admin uploads each month's Excel file in the browser. It needs no Claude and no Python.

## One-time setup (about 10 minutes)

1. **GitHub:** create a new repository (it can be private) and upload everything in this folder to it, keeping the folder structure.
2. **Netlify:** *Add new site → Import an existing project → GitHub*, then pick the repository.
   You don't need to change any build settings. `netlify.toml` already has them.
   Then run *Deploys → Trigger deploy* once so the site picks the password up.
4. **Upload September:** open the site and upload `seed/2026-09.json` (the September data that was live before). You can upload the Excel file instead.

## Every month

Open the site → **Нийтлэх**.
Uploading a month that already exists replaces it. "Устгах" removes a month.

## How it reads the Excel file

- Sheets `electronics` (first employee row 85) and `motors` (first employee row 57). The upload page lets you
  change the rows or tick other sheets.
- Employee row: code in column B, name in column G. Day rows: code in C, date in G.
- Columns used: L start, M end, Q clock-in, S clock-out, AE late/absent, AF excused, AK worked.
- The month is detected from the dates. You can change it before publishing.

## Where things live

- `public/index.html`: the whole website (login, table, hidden admin page).
- `netlify/functions/attendance.mjs`: returns one employee's month (employees never download the whole file).
- `netlify/functions/admin.mjs`: password-protected upload and delete.
- Data is stored in **Netlify Blobs** (included free with Netlify), under the store name `attendance`.

To hand the job to someone else, give them the site link, the code and the password.
To change the password, edit `ADMIN_PASSWORD` in Netlify and redeploy.
