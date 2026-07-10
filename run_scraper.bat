@echo off
title Erafone Scraper - Bagaskara Cell
color 0B

echo ===================================================
echo   BAGASKARA CELL - ERAFONE PRODUCT SCRAPER
echo ===================================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Python tidak ditemukan di sistem Anda!
    echo Silakan install Python terlebih dahulu dan pastikan opsi
    echo "Add Python to PATH" dicentang saat instalasi.
    echo.
    echo Unduh Python di: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo [1/3] Memeriksa instalasi Python... OK.
echo.

:: Check requirements file exists
if not exist "erafone_scraper\requirements.txt" (
    color 0C
    echo [ERROR] File erafone_scraper\requirements.txt tidak ditemukan!
    echo Pastikan Anda menjalankan file batch ini di root folder project BagaskaraWeb.
    echo.
    pause
    exit /b 1
)

echo [2/3] Menginstal / Memperbarui dependensi Python...
python -m pip install --upgrade pip >nul 2>&1
pip install -r erafone_scraper\requirements.txt
if %errorlevel% neq 0 (
    color 0E
    echo [WARNING] Ada kendala saat menginstal dependensi. 
    echo Mencoba melanjutkan eksekusi scraper...
    echo.
) else (
    echo [OK] Dependensi terpasang dengan sukses.
)
echo.

echo [3/3] Menjalankan Erafone Scraper...
echo.
python erafone_scraper\erafone_scraper.py

echo.
echo ===================================================
echo   Proses Scraper Selesai!
echo ===================================================
echo.
pause
