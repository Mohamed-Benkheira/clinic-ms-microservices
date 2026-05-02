#!/bin/bash

# Start the notification API in the background
uvicorn api:app --host 0.0.0.0 --port 8005 &
API_PID=$!

# Give the API a moment to start
sleep 2

# Start the worker (blocking)
python -u worker.py

# If worker exits, stop the API too
kill $API_PID
