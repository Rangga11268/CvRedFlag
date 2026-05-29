@echo off
echo ========================================================
echo   CVRedFlag.ai - GitHub Repository Initialization
echo ========================================================
echo.
echo Langkah ini akan menginisialisasi repositori Git lokal
echo dan mempersiapkannya untuk di-push ke GitHub Anda.
echo.
pause

git init
git add .
git commit -m "feat: inisialisasi CVRedFlag.ai ATS Scanner & Google XYZ Optimizer"
git branch -M main

echo.
echo ========================================================
echo Git lokal berhasil di-setup dan di-commit!
echo ========================================================
echo.
set /p REPO_URL="Masukkan URL Repositori GitHub Anda (misal https://github.com/user/repo.git): "

if "%REPO_URL%"=="" (
    echo URL kosong. Silakan jalankan perintah remote add secara manual nanti.
) else (
    git remote add origin %REPO_URL%
    echo Remote origin berhasil ditambahkan!
    echo.
    echo Menjalankan push ke GitHub...
    git push -u origin main
)

pause
