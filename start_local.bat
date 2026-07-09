@echo off
title Bagaskara Cell Catalog Local Dev Server
echo ===================================================
echo   MEMULAI KATALOG BAGASKARA CELL DI PC LOKAL
echo ===================================================
echo.
echo [1/3] Memeriksa folder node_modules...
if not exist node_modules (
    echo node_modules tidak ditemukan. Menginstal dependencies...
    call npm install
) else (
    echo node_modules ditemukan. Lewati langkah install.
)
echo.
echo [2/3] Membuka browser ke http://localhost:3000...
start http://localhost:3000
echo.
echo [3/3] Menjalankan Next.js Development Server...
call npm run dev
pause
