# Go 后端

基于 GitHub Gist 的轻量级网盘后端。

## 配置

```bash
export GITHUB_TOKEN=your_token
export MASTER_PASSWORD=qyt123
export PORT=8080
```

## 运行

```bash
go run main.go
```

## API

- `GET /api/files` - 列出文件
- `POST /api/files` - 上传文件
- `GET /api/files/{id}` - 下载文件
- `DELETE /api/files/{id}` - 删除文件
