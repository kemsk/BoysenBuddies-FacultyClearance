#!/bin/bash

mkdir -p /app/staticfiles/frontend
cp -r /app/frontend_dist/* /app/staticfiles/frontend/

mkdir -p /app/static

python manage.py collectstatic --noinput
python manage.py makemigrations --noinput
python manage.py migrate --noinput --fake-initial

if [ "$SEED_TEST_DATA" = "true" ]; then
python manage.py seed_test_data
fi

# Start the application using Gunicorn
python -m gunicorn --bind 0.0.0.0:8001 --workers 3 XUFC.wsgi:application