@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Pack + Deploy 広島_佐藤工業_SS to GitHub Pages

REM 作業ルート直下を編集 → 同名サブフォルダ 広島_佐藤工業_SS\ が GitHub / Pages 用パッケージ
set "SITE_DIR=広島_佐藤工業_SS"
set "PKG=%~dp0%SITE_DIR%"
set "DEPLOY_ROOT=%~dp0..\_wbgt-cube-deploy"
set "TARGET=%DEPLOY_ROOT%\%SITE_DIR%"
set "WF_SRC=%~dp0github\workflows\update-hiroshima-sato-news.yml"
set "WF_DST=%DEPLOY_ROOT%\.github\workflows\update-hiroshima-sato-news.yml"

echo.
echo  [1/2] 本番用フォルダを更新: %SITE_DIR%\
echo.

if not exist "%PKG%" mkdir "%PKG%"
if not exist "%PKG%\assets" mkdir "%PKG%\assets"
if not exist "%PKG%\data" mkdir "%PKG%\data"
if not exist "%PKG%\config" mkdir "%PKG%\config"
if not exist "%PKG%\scripts" mkdir "%PKG%\scripts"

copy /Y "index-4face.html" "%PKG%\" >nul
copy /Y "index-5face.html" "%PKG%\" >nul
copy /Y "assets\signage-news.js" "%PKG%\assets\" >nul
copy /Y "assets\sato_kogyo_logo_stack.png" "%PKG%\assets\" >nul
copy /Y "assets\sato_kogyo_logo_wide.png" "%PKG%\assets\" >nul
copy /Y "assets\sato_kogyo_logo_foot.png" "%PKG%\assets\" >nul
copy /Y "data\news.json" "%PKG%\data\" >nul
copy /Y "config\news.config.json" "%PKG%\config\" >nul
copy /Y "scripts\fetch-homepage-news.mjs" "%PKG%\scripts\" >nul
if exist "package.json" copy /Y "package.json" "%PKG%\" >nul

echo  パッケージ内容:
dir /b "%PKG%"
dir /b "%PKG%\assets"
echo.

if not exist "%DEPLOY_ROOT%\.git" (
    echo  wbgt-cube の作業コピーがありません。
    echo  初回のみ:
    echo    git clone https://github.com/digital-signage-led/wbgt-cube.git "%DEPLOY_ROOT%"
    echo.
    echo  パッケージ %SITE_DIR%\ は作成済みです。clone 後にもう一度この bat を実行してください。
    pause
    exit /b 1
)

echo  [2/2] GitHub Pages へアップロード...
echo.

if not exist "%TARGET%" mkdir "%TARGET%"
xcopy /E /I /Y "%PKG%\*" "%TARGET%\" >nul

if exist "%WF_SRC%" (
    if not exist "%DEPLOY_ROOT%\.github\workflows" mkdir "%DEPLOY_ROOT%\.github\workflows"
    copy /Y "%WF_SRC%" "%WF_DST%" >nul
)

pushd "%DEPLOY_ROOT%"
git pull --rebase origin main
git add "%SITE_DIR%"
if exist ".github\workflows\update-hiroshima-sato-news.yml" git add .github/workflows/update-hiroshima-sato-news.yml
git diff --staged --quiet
if %errorlevel%==0 (
    echo  変更はありません。
    popd
    pause
    exit /b 0
)
git commit -m "Update 広島_佐藤工業_SS signage + news automation"
git push origin main
set "PUSH_ERR=%errorlevel%"
popd

echo.
if %PUSH_ERR%==0 (
    echo  完了。
    echo  5面: https://digital-signage-led.github.io/wbgt-cube/広島_佐藤工業_SS/index-5face.html?native640=1
    echo  4面: https://digital-signage-led.github.io/wbgt-cube/広島_佐藤工業_SS/index-4face.html?layout512=1^&native640=1
) else (
    echo  push に失敗しました。Git の認証を確認してください。
)
echo.
pause
