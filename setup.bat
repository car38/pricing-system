@echo off
cd /d "C:\pricing-system"
if not exist "C:\pricing-system" mkdir C:\pricing-system
cd /d C:\pricing-system
echo Downloading...
curl -L -o master.zip https://github.com/car38/pricing-system/archive/refs/heads/main.zip
tar -xf master.zip --strip-components=1
del master.zip
echo Installing...
call npm install --silent
cd server
call npm install --silent
cd ..
call node .\node_modules\vite\bin\vite.js build --silent
cd server
start "Pricing" /MIN cmd /c "node index.js"
echo.
echo ================================
echo  System started!
echo  Local: http://localhost:3001
echo  External: http://175.24.139.9:3001
echo ================================
pause
