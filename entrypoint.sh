#!/bin/bash

mkdir -p /app/staticfiles/frontend
cp -r /app/frontend_dist/* /app/staticfiles/frontend/

python manage.py collectstatic --noinput
python manage.py makemigrations --noinput
python manage.py migrate --noinput

# Start the application using Gunicorn
python -m gunicorn --bind 0.0.0.0:8001 --workers 3 XUFC.wsgi:application