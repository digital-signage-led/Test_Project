@echo off
cd /d "%~dp0"
title Deploy to GitHub Pages (wbgt-cube)

set "DEPLOY_ROOT=%~dp0..\_wbgt-cube-deploy"
set "TARGET=%DEPLOY_ROOT%\hiroshima_sato_kogyo"

if not exist "%DEPLOY_ROOT%\.git" (
    echo.
    echo  wbgt-cube の作業コピーがありません。
    echo  初回のみ次を実行してください:
    echo    git clone https://github.com/digital-signage-led/wbgt-cube.git "%DEPLOY_ROOT%"
    echo.
    pause
    exit /b 1
)

echo.
echo  GitHub Pages へ反映します...
echo.

if not exist "%TARGET%" mkdir "%TARGET%"
copy /Y "index-4face.html" "%TARGET%\"
copy /Y "index-5face.html" "%TARGET%\"

if exist "assets" (
    if not exist "%TARGET%\assets" mkdir "%TARGET%\assets"
    xcopy /E /I /Y "assets\*" "%TARGET%\assets\"
)

pushd "%DEPLOY_ROOT%"
git pull --rebase origin main
git add hiroshima_sato_kogyo\index-4face.html
git add hiroshima_sato_kogyo\index-5face.html
if exist "hiroshima_sato_kogyo\assets" git add hiroshima_sato_kogyo\assets\
git diff --staged --quiet
if %errorlevel%==0 (
    echo  変更はありません。
    popd
    pause
    exit /b 0
)
git commit -m "Update Hiroshima Fukuyama Sato Kogyo 4/5-face signage"
git push origin main
set "PUSH_ERR=%errorlevel%"
popd

echo.
if %PUSH_ERR%==0 (
    echo  完了。1〜2分後に反映されます:
    echo  4面: https://digital-signage-led.github.io/wbgt-cube/hiroshima_sato_kogyo/index-4face.html?layout512=1^&native640=1
    echo  5面: https://digital-signage-led.github.io/wbgt-cube/hiroshima_sato_kogyo/index-5face.html?native640=1
) else (
    echo  push に失敗しました。Git の認証を確認してください。
)
echo.
pause
