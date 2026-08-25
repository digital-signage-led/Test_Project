@echo off
cd /d "%~dp0"
echo 大阪 警報情報（本番）を起動します...
start "" "http://127.0.0.1:8080/"
node server.mjs
pause
