@echo off
REM Start Python Image Service on Windows

echo 🚀 Starting Python Image Service...
echo 📦 Installing dependencies...

pip install -r requirements.txt

echo ✅ Dependencies installed
echo 🔄 Starting service on http://localhost:8001
echo.

python main.py

