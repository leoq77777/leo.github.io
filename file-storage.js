/**
 * 基于 GitHub Gist 的轻量级网盘（使用 Go 后端）
 * 支持文件上传、下载、删除，权限控制和可见性设置
 */

class FileStorageManager {
    constructor() {
        // 后端 API 地址（可通过环境变量或配置修改）
        this.apiBaseUrl = this.getApiBaseUrl();
        this.files = [];
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            setTimeout(() => this.init(), 100);
        }
    }

    /**
     * 获取后端 API 地址
     */
    getApiBaseUrl() {
        // 优先从配置或环境变量获取
        if (window.FILE_STORAGE_API_URL) {
            return window.FILE_STORAGE_API_URL;
        }
        // 默认使用相对路径（如果前后端同域）或完整 URL
        return 'http://localhost:8080'; // 开发环境默认地址
    }

    /**
     * 获取请求头（包含 Master Token）
     */
    getHeaders(includeMasterToken = false) {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (includeMasterToken && this.isMasterMode()) {
            headers['X-Master-Token'] = this.getMasterToken();
        }
        
        return headers;
    }

    /**
     * 获取 Master Token
     */
    getMasterToken() {
        // 从 localStorage 或配置获取
        return localStorage.getItem('master-token') || 'qyt123';
    }

    async init() {
        await this.loadFiles();
    }

    /**
     * 检查是否为 Master 模式
     */
    isMasterMode() {
        return document.body.classList.contains('master-mode');
    }

    /**
     * 从后端加载文件列表
     */
    async loadFiles() {
        try {
            const headers = this.getHeaders(true);
            const response = await fetch(`${this.apiBaseUrl}/api/files`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.warn('未授权访问');
                }
                this.files = [];
                return;
            }

            this.files = await response.json();
        } catch (error) {
            console.error('加载文件列表失败:', error);
            this.files = [];
        }
    }

    /**
     * 上传文件
     */
    async uploadFile(file, visibility = 'guest') {
        if (!this.isMasterMode()) {
            this.showNotification('仅 Master 模式可上传文件', 'error');
            return false;
        }

        if (!file) {
            this.showNotification('请选择文件', 'error');
            return false;
        }

        try {
            this.showNotification('开始上传文件...', 'info');

            const formData = new FormData();
            formData.append('file', file);
            formData.append('visibility', visibility);

            const headers = {
                'X-Master-Token': this.getMasterToken()
                // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
            };

            const response = await fetch(`${this.apiBaseUrl}/api/files`, {
                method: 'POST',
                headers: headers,
                body: formData
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || '上传失败');
            }

            const fileEntry = await response.json();
            this.files.push(fileEntry);

            this.showNotification('文件上传成功', 'success');
            this.renderFiles();
            return true;
        } catch (error) {
            console.error('上传文件失败:', error);
            this.showNotification('上传失败: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * 通过 ID 下载文件
     */
    async downloadFileById(fileId) {
        try {
            const headers = this.getHeaders(true);
            const response = await fetch(`${this.apiBaseUrl}/api/files/${fileId}`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.showNotification('此文件仅 Master 模式可见', 'error');
                } else if (response.status === 404) {
                    this.showNotification('文件不存在', 'error');
                } else {
                    throw new Error('下载失败');
                }
                return;
            }

            // 获取文件名
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 'download';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            // 获取文件内容
            const blob = await response.blob();
            
            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showNotification('下载完成', 'success');
        } catch (error) {
            console.error('下载文件失败:', error);
            this.showNotification('下载失败: ' + error.message, 'error');
        }
    }

    /**
     * 删除文件
     */
    async deleteFile(fileId) {
        if (!this.isMasterMode()) {
            this.showNotification('仅 Master 模式可删除文件', 'error');
            return false;
        }

        try {
            const headers = {
                'X-Master-Token': this.getMasterToken()
            };

            const response = await fetch(`${this.apiBaseUrl}/api/files/${fileId}`, {
                method: 'DELETE',
                headers: headers
            });

            if (!response.ok) {
                throw new Error('删除失败');
            }

            // 从本地列表中移除
            this.files = this.files.filter(f => f.id !== fileId);

            this.showNotification('文件已删除', 'success');
            this.renderFiles();
            return true;
        } catch (error) {
            console.error('删除文件失败:', error);
            this.showNotification('删除失败: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * HTML 转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * 渲染文件列表
     */
    renderFiles() {
        const panel = document.getElementById('files-panel');
        if (!panel) return;

        // 过滤可见文件（后端已过滤，但前端也做一次以确保）
        const isMaster = this.isMasterMode();
        const visibleFiles = this.files.filter(file => {
            return file.visibility === 'guest' || isMaster;
        });

        if (visibleFiles.length === 0) {
            panel.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-cloud"></i>
                    <p>暂无文件</p>
                </div>
            `;
            return;
        }

        let html = '';
        if (isMaster) {
            html += `
                <div class="file-upload-area master-mode-only">
                    <input type="file" id="file-input" multiple style="display: none;">
                    <button class="upload-button" onclick="document.getElementById('file-input').click()">
                        <i class="fas fa-upload"></i> 上传文件
                    </button>
                    <div class="upload-options" style="margin-top: 10px;">
                        <label>
                            <input type="radio" name="file-visibility" value="guest" checked> Guest 可见
                        </label>
                        <label style="margin-left: 15px;">
                            <input type="radio" name="file-visibility" value="master"> Master 可见
                        </label>
                    </div>
                </div>
            `;
        }

        html += '<div class="file-list">';
        visibleFiles.forEach(file => {
            const uploadDate = new Date(file.uploadedAt).toLocaleString('zh-CN');
            html += `
                <div class="file-item" data-file-id="${file.id}">
                    <div class="file-info">
                        <i class="fas fa-file"></i>
                        <div class="file-details">
                            <div class="file-name">${this.escapeHtml(file.name)}</div>
                            <div class="file-meta">
                                ${this.formatFileSize(file.size)} • ${uploadDate}
                                ${file.visibility === 'master' ? '<span class="visibility-badge">Master</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="file-actions">
                        <button class="file-action-btn download-btn" data-file-id="${file.id}">
                            <i class="fas fa-download"></i> 下载
                        </button>
                        ${isMaster ? `
                            <button class="file-action-btn delete-btn" data-file-id="${file.id}">
                                <i class="fas fa-trash"></i> 删除
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        html += '</div>';

        panel.innerHTML = html;

        // 绑定文件操作事件（使用事件委托）
        panel.addEventListener('click', (e) => {
            const fileId = e.target.closest('[data-file-id]')?.dataset.fileId;
            if (!fileId) return;

            if (e.target.closest('.download-btn')) {
                this.downloadFileById(fileId);
            } else if (e.target.closest('.delete-btn')) {
                if (confirm('确定要删除这个文件吗？')) {
                    this.deleteFile(fileId);
                }
            }
        });

        // 绑定文件上传事件
        if (isMaster) {
            const fileInput = document.getElementById('file-input');
            if (fileInput) {
                fileInput.addEventListener('change', async (e) => {
                    const files = Array.from(e.target.files);
                    const visibility = document.querySelector('input[name="file-visibility"]:checked')?.value || 'guest';
                    
                    for (const file of files) {
                        await this.uploadFile(file, visibility);
                    }
                    
                    e.target.value = ''; // 重置输入
                });
            }
        }
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `file-notification file-notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// 创建全局实例
const fileStorageManager = new FileStorageManager();

// 监听 Master 模式切换，重新渲染文件列表
const masterModeFileObserver = new MutationObserver(() => {
    if (document.getElementById('files-panel')) {
        fileStorageManager.loadFiles().then(() => {
            fileStorageManager.renderFiles();
        });
    }
});

if (document.body) {
    masterModeFileObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
    });
}
