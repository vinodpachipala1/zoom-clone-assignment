# Zoom Clone - SDE Fullstack Assignment

A functional video conferencing dashboard and meeting lobby replicating Zoom's core workflows and UI.

## Tech Stack
* **Frontend:** Next.js (App Router), React, Tailwind CSS
* **Backend:** Django REST Framework, Python
* **Database:** SQLite3

## Assumptions Made
1. **Mock Authentication:** Per the "No Login Required" instruction, the application uses `localStorage` to securely track the user's session and flag whether they are the `Host` or a standard participant, bypassing the need for JWTs.
2. **Environment:** Fallback clipboard logic (`document.execCommand`) is implemented so that the "Copy Link" feature works flawlessly even when testing locally over HTTP (localhot) where the modern `navigator.clipboard` API is restricted.

## Setup Instructions

### Backend (Django)
1. Navigate to the backend directory.
2. Run `pip install -r requirements.txt`
3. Run `python manage.py migrate`
4. Run `python manage.py seed_db` to populate sample data.
5. Create a `.env` file with: `FRONTEND_URL=http://localhost:3000`
6. Run `python manage.py runserver`

### Frontend (Next.js)
1. Navigate to the frontend directory.
2. Run `npm install`
3. Create a `.env` file with: `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000`
4. Run `npm run dev`