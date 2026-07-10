@echo off
title Bagaskara Cell Catalog Local Dev Server
echo ===================================================
echo   MEMULAI KATALOG BAGASKARA CELL DI PC LOKAL
echo ===================================================
echo.

:: 1. Memeriksa apakah Node.js/NPM terinstal
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm tidak ditemukan di system PATH!
    echo Silakan pastikan Node.js sudah terinstal dan terdaftar di Environment Variables.
    echo Anda dapat mendownload Node.js di: https://nodejs.org/
    echo.
    pause
    exit /b
)

echo [1/3] Memeriksa folder node_modules...
if not exist node_modules (
    echo node_modules tidak ditemukan. Menginstal dependencies...
    call npm.cmd install
    if %errorlevel% neq 0 (
        echo [ERROR] Gagal menginstal dependencies!
        pause
        exit /b
    )
) else (
    echo node_modules ditemukan. Lewati langkah install.
)
echo.

echo [2/3] Membuka browser ke http://localhost:3000...
start http://localhost:3000
echo.

echo [3/3] Menjalankan Next.js Development Server...
call npm.cmd run dev
if %errorlevel% neq 0 (
    echo [ERROR] Gagal menjalankan Next.js server!
    pause
)
