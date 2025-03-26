#!/bin/bash

# Start Django backend
cd /app/backend
python manage.py migrate
python manage.py runserver 0.0.0.0:8000 &

# Start React frontend in the background
cd /app/frontend
npm run dev -- --host 0.0.0.0 > frontend.log 2>&1 &

# Keep container running
tail -f frontend.log
