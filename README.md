# ESTARA — Where Property Meets Intelligence

A phased AI-powered real-estate platform. This starter includes:
- React + Vite frontend with Estara's locked forest/pista/cream visual identity
- Python + FastAPI backend
- Sample property API and health endpoint
- Clear separation for future ML models

## Requirements
- Node.js 20+ (recommended)
- Python 3.11+
- VS Code

## 1. Run the backend (Windows PowerShell)

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend docs: http://127.0.0.1:8000/docs

If PowerShell blocks activation, run this for the current terminal only:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

## 2. Run the frontend (open a second terminal)

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL Vite prints (usually http://localhost:5173).

## Current scope
This is the project foundation, not the finished product. Property cards currently use clearly identified demo data. The ML directory is prepared for real models in a later phase. Do not use demo listings or scores as real-world property/financial advice.
