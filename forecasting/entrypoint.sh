#!/bin/bash

# Start Django backend
cd /app/backend
python manage.py makemigrations forecast
python manage.py migrate
python manage.py runserver 0.0.0.0:8001 &

# Start React frontend in the background
cd /app/frontend
export HOST=0.0.0.0
npm start > frontend.log 2>&1 &

# Keep container running
tail -f frontend.log

