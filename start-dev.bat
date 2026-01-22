@echo off
REM 开发环境启动脚本 (Windows)
REM 同时启动 Go 后端和前端服务器

echo ========================================
echo   启动开发环境
echo ========================================
echo.

REM 检查 Go 是否安装
where go >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未找到 Go，请先安装 Go: https://golang.org/dl/
    pause
    exit /b 1
)

REM 检查 Python 是否安装（用于前端服务器）
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [警告] 未找到 Python，将无法启动前端服务器
    echo 请安装 Python 或使用其他方式启动前端服务器
    echo.
)

REM 设置环境变量
if not defined GITHUB_TOKEN (
    echo [错误] 未设置 GITHUB_TOKEN 环境变量
    echo 请设置: set GITHUB_TOKEN=your_token_here
    echo 或在当前会话中设置后重新运行此脚本
    pause
    exit /b 1
)

if not defined MASTER_PASSWORD (
    set MASTER_PASSWORD=qyt123
)

if not defined PORT (
    set PORT=8080
)

if not defined ALLOWED_ORIGIN (
    set ALLOWED_ORIGIN=*
    echo [提示] ALLOWED_ORIGIN 设置为 *（允许所有来源）
    echo 生产环境请设置为你的 GitHub Pages 域名
    echo.
)

echo [配置] GITHUB_TOKEN: %GITHUB_TOKEN:~0,10%...
echo [配置] MASTER_PASSWORD: %MASTER_PASSWORD%
echo [配置] PORT: %PORT%
echo [配置] ALLOWED_ORIGIN: %ALLOWED_ORIGIN%
echo.

REM 进入后端目录
cd backend

REM 检查 go.mod 是否存在
if not exist go.mod (
    echo [错误] 未找到 go.mod，请确保在项目根目录运行此脚本
    pause
    exit /b 1
)

REM 下载依赖
echo [后端] 下载 Go 依赖...
go mod download
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 下载依赖失败
    pause
    exit /b 1
)

REM 编译后端（可选，直接运行也可以）
echo [后端] 编译 Go 程序...
go build -o file-storage-server.exe
if %ERRORLEVEL% NEQ 0 (
    echo [警告] 编译失败，将直接运行 go run
)

REM 启动后端服务器（在新窗口）
echo [后端] 启动服务器在端口 %PORT%...
start "Go Backend Server" cmd /k "set GITHUB_TOKEN=%GITHUB_TOKEN% && set MASTER_PASSWORD=%MASTER_PASSWORD% && set PORT=%PORT% && set ALLOWED_ORIGIN=%ALLOWED_ORIGIN% && go run main.go storage\gist.go storage\files.go"

REM 等待后端启动
timeout /t 3 /nobreak >nul

REM 返回项目根目录
cd ..

REM 启动前端服务器（在新窗口）
echo [前端] 启动前端服务器在端口 8000...
start "Frontend Server" cmd /k "python -m http.server 8000"

echo.
echo ========================================
echo   开发环境已启动
echo ========================================
echo.
echo [后端] http://localhost:%PORT%
echo [前端] http://localhost:8000
echo.
echo [提示] 关闭窗口即可停止对应的服务器
echo [提示] 或按 Ctrl+C 停止
echo.
echo 按任意键退出此脚本（服务器将继续运行）...
pause >nul

