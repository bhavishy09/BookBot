#!/usr/bin/env bash
# Start both backend and frontend for local development
# Usage: bash start.sh

set -e

# Unset any inherited DATABASE_URL that may conflict
unset DATABASE_URL

echo "=== Starting FastAPI backend on :8000 ==="
cd backend
python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload &
BACK_PID=$!
cd ..

echo "=== Starting Vite frontend on :5173 ==="
cd frontend
npx vite --host 127.0.0.1 --port 5173 &
FRONT_PID=$!
cd ..

echo ""
echo "Backend  → http://127.0.0.1:8000  (PID $BACK_PID)"
echo "Frontend → http://127.0.0.1:5173  (PID $FRONT_PID)"
echo "API docs → http://127.0.0.1:8000/docs"
echo ""
echo "Press Ctrl+C to stop both."

# Wait for either process to exit
wait $BACK_PID $FRONT_PID
