@echo off
title GAJA CULT ONLINE DEPLOYER
cd /d "%~dp0"
echo ========================================================
echo  [GAJA CULT] Deploying to https://gajakyo-online.surge.sh
echo ========================================================
echo.
python deploy_with_email.py
pause

