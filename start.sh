#!/bin/bash
echo "======================================================="
echo "ReconOS - AI Finance Control Plane"
echo "Razorpay Buildathon Track 04: AI Finance Controller"
echo "======================================================="
echo ""

cd backend && python -m uvicorn app.main:app --port 8000 --reload &
BACKEND_PID=$!

sleep 3

cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "System operational!"
echo "Web UI: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo "======================================================="

wait $BACKEND_PID $FRONTEND_PID
