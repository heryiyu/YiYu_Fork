@echo off
chcp 65001 > nul
echo ----------------------------------------
echo 正在部署 Edge Function: notify-plans
echo ----------------------------------------

call npx supabase functions deploy notify-plans --no-verify-jwt

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [❌] 部署失敗！
    echo.
    echo 如果出現 "Cannot find project ref" 錯誤，請先執行以下指令連結專案：
    echo npx supabase link --project-ref [YOUR_PROJECT_ID]
    echo.
) else (
    echo.
    echo [✅] 部署成功！
)

pause
