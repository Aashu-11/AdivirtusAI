#!/bin/bash

# Print header
echo "===================================================="
echo "   Starting Adivirtus AI Backend Server"
echo "===================================================="

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "[✓] Activating virtual environment..."
    source venv/bin/activate
else
    echo "[!] Virtual environment not found at ./venv"
    echo "    Using system Python installation instead"
fi

# Check Python version
echo "[i] Using Python version:"
python3 --version

# Check critical environment variables
echo "[i] Checking environment variables..."
if [ -z "$OPENAI_API_KEY" ]; then
    echo "[!] WARNING: OPENAI_API_KEY not set - some AI features may not work"
else
    echo "[✓] OPENAI_API_KEY is set"
fi

if [ -z "$SUPABASE_URL" ]; then
    echo "[!] WARNING: SUPABASE_URL not set - database features may not work"
else
    echo "[✓] SUPABASE_URL is set"
fi

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "[!] WARNING: SUPABASE_SERVICE_KEY not set - database features may not work"
else
    echo "[✓] SUPABASE_SERVICE_KEY is set"
fi

# Kill any existing Django server processes
echo "[i] Stopping any existing Django servers..."
pkill -f "python3 manage.py runserver" || true

# Start the Django server
echo "[i] Starting Django server on 0.0.0.0:8000..."
echo "===================================================="
python3 manage.py runserver 0.0.0.0:8000 