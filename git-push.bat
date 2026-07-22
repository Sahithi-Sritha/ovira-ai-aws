@echo off
echo ========================================
echo Ovira AI - Git Push Automation
echo ========================================
echo.

REM Check if git is initialized
if not exist .git (
    echo Initializing git repository...
    git init
    echo.
)

REM Check current status
echo Checking git status...
git status
echo.

REM Stage all changes
echo Staging all changes...
git add .
echo.

REM Prompt for commit message
set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" set commit_msg="Update: Added PWA install button and fixed demo account data"

echo.
echo Committing with message: %commit_msg%
git commit -m "%commit_msg%"
echo.

REM Check if remote exists
git remote -v | find "origin" >nul
if errorlevel 1 (
    echo No remote repository configured.
    set /p remote_url="Enter GitHub repository URL: "
    git remote add origin !remote_url!
    echo Remote added successfully.
    echo.
)

REM Get current branch
for /f "tokens=*" %%a in ('git branch --show-current') do set current_branch=%%a

REM Push to remote
echo Pushing to remote repository (branch: %current_branch%)...
git push -u origin %current_branch%

if errorlevel 1 (
    echo.
    echo ========================================
    echo Push failed! Common solutions:
    echo 1. Set up GitHub remote: git remote add origin [your-repo-url]
    echo 2. Authenticate with GitHub (use Personal Access Token)
    echo 3. Check branch name and try: git push -u origin main
    echo ========================================
) else (
    echo.
    echo ========================================
    echo Successfully pushed to GitHub!
    echo ========================================
)

echo.
pause
