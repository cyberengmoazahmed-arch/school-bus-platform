@echo off
title SafeRide Launcher
cd /d "%~dp0"

echo ================================================
echo   SafeRide - local launcher
echo ================================================

if not exist node_modules (
  echo [1/3] Installing dependencies (first run)...
  call npm install --legacy-peer-deps
  if errorlevel 1 ( echo Install failed. && pause && exit /b 1 )
)

if not exist .next (
  echo [2/3] Building production bundle (first run, takes a few minutes)...
  call npm run build
  if errorlevel 1 ( echo Build failed. && pause && exit /b 1 )
)

echo [3/3] Starting server...
start "SafeRide Server" /min cmd /c "npm run start -- -p 3000"

echo.
echo  Local address :  http://localhost:3000
echo  Opening browser in 5 seconds...
start "" http://localhost:3000
timeout /t 5 /nobreak >nul

where cloudflared >nul 2>&1
if errorlevel 1 (
  echo.
  echo  Note: cloudflared not found - app runs locally only.
  echo  (Close the "SafeRide Server" window to stop.)
  echo.
  echo  First request may take a few seconds to respond.
  pause
  exit /b 0
)

echo.
echo  Public tunnel: starting... (keep this window open)
echo  Press Ctrl+C to stop the public link.
echo.
cloudflared tunnel --url http://localhost:3000