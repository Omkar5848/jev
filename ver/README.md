# Jeevak - Next.js (TS) Fullstack Auth + OTP

 Install deps:
   ```bash
   npm install
   npm run dev
   ```
 Open http://localhost:3000

## Features
- Apple ID–style login/register/forgot forms
- Email OTP for password reset (Gmail via Nodemailer)
- JSON file storage (no DB setup)
- JWT auth stored in httpOnly cookie
- Dashboard with logout
- Home page with 3D heading & auto-rotating hospital images + arrows

## Notes
- OTP expires in 5 minutes.
- This demo stores users in `data/db.json`. For production, move to a database.
- Make sure Gmail is configured for App Passwords.


## Backend
A new `backend/` folder was added (Express + MongoDB).
- Start backend: `cd backend && npm install && npm run dev`
- Start frontend: `cd ver && npm install && npm run dev`

Make sure MongoDB is running and set `MONGO_URI` in `backend/.env` if needed.

Set `NEXT_PUBLIC_API_URL` to backend base URL if not `http://localhost:5000`.
