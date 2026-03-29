@echo off
echo Starting ReachRadar Ultra Backend...
cd /d "%~dp0"

REM Find and activate virtual environment
if exist ".analytics-env\Scripts\activate.bat" (
    call .analytics-env\Scripts\activate.bat
) else (
    echo Virtual env not found. Running without it.
)

REM Check for API key
findstr /C:"your_key_here" .env >nul 2>&1
if %errorlevel%==0 (
    echo.
    echo [WARNING] GEMINI_API_KEY is still set to 'your_key_here'
    echo Please edit backend\.env and add your real key from:
    echo https://aistudio.google.com/
    echo.
)

echo Installing/updating requirements...
pip install -r requirements.txt -q

echo.
echo Starting server at http://localhost:8000
echo API docs: http://localhost:8000/docs
echo Health:   http://localhost:8000/health
echo.
uvicorn app.main:app --reload --port 8000 --workers 1
