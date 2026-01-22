#!/bin/bash
# 开发环境启动脚本 (Linux/Mac/Git Bash)
# 同时启动 Go 后端和前端服务器

set -e

echo "========================================"
echo "  启动开发环境"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Go 是否安装
if ! command -v go &> /dev/null; then
    echo -e "${RED}[错误] 未找到 Go，请先安装 Go: https://golang.org/dl/${NC}"
    exit 1
fi

# 检查 Python 是否安装
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo -e "${YELLOW}[警告] 未找到 Python，将无法启动前端服务器${NC}"
    echo "请安装 Python 或使用其他方式启动前端服务器"
    echo ""
fi

# 设置环境变量
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}[错误] 未设置 GITHUB_TOKEN 环境变量${NC}"
    echo "请设置: export GITHUB_TOKEN=your_token_here"
    echo "或在当前会话中设置后重新运行此脚本"
    exit 1
fi

if [ -z "$MASTER_PASSWORD" ]; then
    export MASTER_PASSWORD="qyt123"
fi

if [ -z "$PORT" ]; then
    export PORT="8080"
fi

if [ -z "$ALLOWED_ORIGIN" ]; then
    export ALLOWED_ORIGIN="*"
    echo -e "${YELLOW}[提示] ALLOWED_ORIGIN 设置为 *（允许所有来源）${NC}"
    echo "生产环境请设置为你的 GitHub Pages 域名"
    echo ""
fi

echo -e "${GREEN}[配置] GITHUB_TOKEN: ${GITHUB_TOKEN:0:10}...${NC}"
echo -e "${GREEN}[配置] MASTER_PASSWORD: $MASTER_PASSWORD${NC}"
echo -e "${GREEN}[配置] PORT: $PORT${NC}"
echo -e "${GREEN}[配置] ALLOWED_ORIGIN: $ALLOWED_ORIGIN${NC}"
echo ""

# 进入后端目录
cd backend

# 检查 go.mod 是否存在
if [ ! -f "go.mod" ]; then
    echo -e "${RED}[错误] 未找到 go.mod，请确保在项目根目录运行此脚本${NC}"
    exit 1
fi

# 下载依赖
echo "[后端] 下载 Go 依赖..."
go mod download
if [ $? -ne 0 ]; then
    echo -e "${RED}[错误] 下载依赖失败${NC}"
    exit 1
fi

# 编译后端（可选）
echo "[后端] 编译 Go 程序..."
go build -o file-storage-server
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}[警告] 编译失败，将直接运行 go run${NC}"
fi

# 返回项目根目录
cd ..

# 创建日志目录
mkdir -p logs

# 启动后端服务器（后台运行）
echo "[后端] 启动服务器在端口 $PORT..."
cd backend
nohup env GITHUB_TOKEN="$GITHUB_TOKEN" \
         MASTER_PASSWORD="$MASTER_PASSWORD" \
         PORT="$PORT" \
         ALLOWED_ORIGIN="$ALLOWED_ORIGIN" \
         go run main.go storage/gist.go storage/files.go > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 检查后端是否启动成功
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}[后端] 服务器已启动 (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}[错误] 后端服务器启动失败，请查看 logs/backend.log${NC}"
    exit 1
fi

# 启动前端服务器（后台运行）
echo "[前端] 启动前端服务器在端口 8000..."
if command -v python3 &> /dev/null; then
    nohup python3 -m http.server 8000 > logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
elif command -v python &> /dev/null; then
    nohup python -m http.server 8000 > logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
else
    echo -e "${YELLOW}[警告] 未找到 Python，跳过前端服务器启动${NC}"
    FRONTEND_PID=""
fi

if [ -n "$FRONTEND_PID" ]; then
    sleep 1
    if ps -p $FRONTEND_PID > /dev/null; then
        echo -e "${GREEN}[前端] 服务器已启动 (PID: $FRONTEND_PID)${NC}"
    else
        echo -e "${YELLOW}[警告] 前端服务器启动失败，请查看 logs/frontend.log${NC}"
    fi
fi

echo ""
echo "========================================"
echo "  开发环境已启动"
echo "========================================"
echo ""
echo -e "${GREEN}[后端] http://localhost:$PORT${NC}"
echo -e "${GREEN}[前端] http://localhost:8000${NC}"
echo ""
echo "[日志] 后端日志: logs/backend.log"
echo "[日志] 前端日志: logs/frontend.log"
echo ""
echo "[提示] 使用 stop-dev.sh 停止所有服务器"
echo "[提示] 或手动 kill 进程: kill $BACKEND_PID $FRONTEND_PID"
echo ""

# 保存 PID 到文件
echo $BACKEND_PID > logs/backend.pid
if [ -n "$FRONTEND_PID" ]; then
    echo $FRONTEND_PID > logs/frontend.pid
fi

echo "按 Ctrl+C 退出（服务器将继续在后台运行）..."
echo ""

# 等待用户中断
trap "echo ''; echo '脚本已退出，但服务器仍在运行。使用 stop-dev.sh 停止。'; exit 0" INT

# 保持脚本运行，显示实时日志
tail -f logs/backend.log logs/frontend.log 2>/dev/null || sleep infinity

