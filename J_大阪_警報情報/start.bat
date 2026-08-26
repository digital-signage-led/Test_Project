@echo off
cd /d "%~dp0"
echo 大阪 警報情報（サイネージ 640x192）を起動します...

REM 先にサーバー起動（別窓）
start "osaka-warning-server" cmd /c "node server.mjs"

timeout /t 1 /nobreak >nul

REM ブラウザ枠なし・左上(0,0)・640x192 で開く（Edge優先 → Chrome）
REM プレイリスト: 本番10秒 → 警報デモ → 地震デモ → 繰り返し
REM ※ ?quake=1 だと地震のみになるので付けない
set URL=http://127.0.0.1:8080/?signage=1

where msedge >nul 2>&1
if %ERRORLEVEL%==0 (
  start "" msedge --app="%URL%" --window-size=640,192 --window-position=0,0 --disable-pinch --force-device-scale-factor=1
  goto :done
)

where chrome >nul 2>&1
if %ERRORLEVEL%==0 (
  start "" chrome --app="%URL%" --window-size=640,192 --window-position=0,0 --disable-pinch --force-device-scale-factor=1
  goto :done
)

REM フォールバック
start "" "%URL%"

:done
echo.
echo キャプチャ範囲: (0,0) - (640,192)
echo Windowsの表示スケールは 100%% 推奨（ズレる場合はPC側スケールを確認）
echo.
pause
