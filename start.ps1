# IHSG Slayer PowerShell Launcher
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "             STARTING IHSG SLAYER                  " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

Write-Host "1. Menutup proses lama di port 8000 dan 3300..." -ForegroundColor Yellow
python scripts/kill_port.py 8000
python scripts/kill_port.py 3300

Write-Host "2. Menjalankan Backend FastAPI (Port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python scripts/start_server.py"

Write-Host "3. Menjalankan Frontend Next.js (Port 3300)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run start"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Aplikasi aktif di:" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3300/" -ForegroundColor White
Write-Host "Backend : http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Cyan
