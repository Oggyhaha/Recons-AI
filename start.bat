@echo off
echo =======================================================
echo ReconOS - AI Finance Control Plane
echo Razorpay Buildathon Track 04: AI Finance Controller
echo =======================================================
echo.

echo Starting FastAPI Backend on http://localhost:8000...
start cmd /k "cd backend && python -m uvicorn app.main:app --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo Starting Next.js Web Application on http://localhost:3000...
start cmd /k "cd frontend && npm run dev"

echo.
echo =======================================================
echo System operational!
echo Web UI: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo =======================================================
