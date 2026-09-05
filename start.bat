@echo off
title IHSG Slayer Launcher
echo ===================================================
echo             STARTING IHSG SLAYER
echo ===================================================
echo 1. Menutup proses lama di port 8000 dan 3300...
python scripts/kill_port.py 8000
python scripts/kill_port.py 3300

echo 2. Menjalankan Backend FastAPI (Port 8000)...
start "IHSG Slayer Backend (Port 8000)" cmd /k "python scripts/start_server.py"

echo 3. Menjalankan Frontend Next.js (Port 3300)...
start "IHSG Slayer Frontend (Port 3300)" cmd /k "cd frontend && npm run start"

echo ===================================================
echo Server berhasil dijalankan!
echo Frontend: http://localhost:3300/
echo Backend : http://127.0.0.1:8000/docs
echo ===================================================
