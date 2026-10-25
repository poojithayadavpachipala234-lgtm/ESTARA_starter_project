ESTARA enquiry persistence update

Files:
- backend/app/main.py: replace your existing backend/app/main.py with ESTARA_backend_main.py (rename it to main.py).
- frontend/src/App.jsx: replace your current App.jsx with ESTARA_App_Enquiries.jsx (rename it to App.jsx).

The backend uses Python's built-in sqlite3; no new pip package is required. It creates backend/app/estara.db automatically when the API starts. Enquiries are saved locally and are not exposed through a public listing endpoint.

Run backend from the backend folder:
  uvicorn app.main:app --reload

Run frontend from the frontend folder:
  npm run dev

Test:
1. Open a property, fill in name + phone/email, submit.
2. Expect the saved-success message only after the API responds successfully.
3. Check backend/app/estara.db exists. To inspect saved records locally, use SQLite tooling or Python; do not expose customer data publicly.

This is a local development foundation, not production-ready. Before public launch, add authentication/authorization for staff access, rate limiting, spam protection, retention/deletion policy, HTTPS, and production database backups.