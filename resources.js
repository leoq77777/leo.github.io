/**
 * 资源收集站管理
 * 用于管理AI学习相关的网站、工具和感悟
 */

class ResourcesManager {
    constructor() {
        this.resources = null; // 初始化为 null，等待异步加载
        this.loading = false;
        // 等待 DOM 加载完成后再初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            // 延迟一点确保其他脚本已加载
            setTimeout(() => this.init(), 100);
        }
    }

    async init() {
        await this.loadResourcesFromFile();
        this.createResourcesSection();
        this.renderResources();
    }

    /**
     * 从 GitHub Gist 加载资源
     */
    async loadResourcesFromFile() {
        this.loading = true;
        try {
            // 优先从 GitHub Gist 加载
            if (typeof githubStorage !== 'undefined') {
                this.resources = await githubStorage.loadResources();
            } else {
                // 如果 GitHub Storage 未加载，尝试从本地文件
                const response = await fetch('resources.json');
                if (response.ok) {
                    this.resources = await response.json();
                } else {
                    throw new Error('无法加载资源');
                }
            }
        } catch (error) {
            console.error('加载资源失败:', error);
            // 使用默认数据
            this.resources = {
                websites: [],
                tools: [],
                insights: []
            };
        } finally {
            this.loading = false;
        }
    }

    createResourcesSection() {
        // 查找 Resources 部分（已替换 Interests）
        const sections = document.querySelectorAll('.section');
        let resourcesSection = null;
        
        sections.forEach(section => {
            const titleElement = section.querySelector('.section-title');
            if (titleElement) {
                const titleText = titleElement.textContent.trim();
                // 匹配 "Resources" 或包含 "Resources" 的标题
                if (titleText === 'Resources' || titleText.includes('Resources')) {
                    resourcesSection = section;
                }
            }
        });
        
        if (!resourcesSection) {
            console.warn('Resources section not found');
            return;
        }

        // 替换Resources section的内容（移除原有的hobby-list等）
        const sectionContent = resourcesSection.querySelector('.section-content');
        if (sectionContent) {
            // 清空原有内容
            sectionContent.innerHTML = '';
            
            // 添加资源标签页和内容
            sectionContent.innerHTML = `
                <div class="resources-tabs">
                    <button class="tab-button active" data-tab="websites">
                        <i class="fas fa-globe"></i> Webs
                    </button>
                    <button class="tab-button" data-tab="tools">
                        <i class="fas fa-tools"></i> Tools
                    </button>
                    <button class="tab-button" data-tab="insights">
                        <i class="fas fa-lightbulb"></i> Thoughts
                    </button>
                    <button class="tab-button" data-tab="files">
                        <i class="fas fa-cloud"></i> Files
                    </button>
                    <button class="tab-button" data-tab="docs">
                        <i class="fas fa-file-alt"></i> Docs
                    </button>
                </div>
                <div class="resources-content">
                    <div class="tab-panel active" id="websites-panel"></div>
                    <div class="tab-panel" id="tools-panel"></div>
                    <div class="tab-panel" id="insights-panel"></div>
                    <div class="tab-panel" id="files-panel"></div>
                    <div class="tab-panel" id="docs-panel"></div>
                </div>
            `;
        } else {
            // 如果没有section-content，创建新的
            const newContent = document.createElement('div');
            newContent.className = 'section-content';
            newContent.innerHTML = `
                <div class="resources-tabs">
                    <button class="tab-button active" data-tab="websites">
                        <i class="fas fa-globe"></i> Webs
                    </button>
                    <button class="tab-button" data-tab="tools">
                        <i class="fas fa-tools"></i> Tools
                    </button>
                    <button class="tab-button" data-tab="insights">
                        <i class="fas fa-lightbulb"></i> Thoughts
                    </button>
                    <button class="tab-button" data-tab="files">
                        <i class="fas fa-cloud"></i> Files
                    </button>
                    <button class="tab-button" data-tab="docs">
                        <i class="fas fa-file-alt"></i> Docs
                    </button>
                </div>
                <div class="resources-content">
                    <div class="tab-panel active" id="websites-panel"></div>
                    <div class="tab-panel" id="tools-panel"></div>
                    <div class="tab-panel" id="insights-panel"></div>
                    <div class="tab-panel" id="files-panel"></div>
                    <div class="tab-panel" id="docs-panel"></div>
                </div>
            `;
            resourcesSection.appendChild(newContent);
        }

        // 初始化标签页切换
        this.initTabs();
    }

    initTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;

                // 移除所有活动状态
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));

                // 添加活动状态
                button.classList.add('active');
                document.getElementById(`${targetTab}-panel`).classList.add('active');

                // 渲染对应内容
                this.renderTabContent(targetTab);
            });
        });

        // 默认渲染第一个标签页
        this.renderTabContent('websites');
    }

    renderTabContent(tabType) {
        const panel = document.getElementById(`${tabType}-panel`);
        if (!panel) return;

        // 如果是网盘标签页，由 fileStorageManager 处理
        if (tabType === 'files') {
            if (typeof fileStorageManager !== 'undefined') {
                fileStorageManager.renderFiles();
            }
            return;
        }

        // 如果是文档标签页，由 docsManager 处理
        if (tabType === 'docs') {
            if (typeof docsManager !== 'undefined') {
                docsManager.renderInPanel(panel);
            }
            return;
        }

        const items = this.resources[tabType] || [];
        
        if (items.length === 0) {
            panel.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>暂无${this.getTabLabel(tabType)}</p>
                </div>
            `;
            return;
        }

        panel.innerHTML = items.map((item, index) => this.renderResourceItem(item, tabType, index)).join('');
    }

    renderResourceItem(item, type, index) {
        if (type === 'websites' || type === 'tools') {
            return `
                <div class="resource-card" data-index="${index}">
                    <div class="resource-header">
                        <h3 class="resource-title">
                            <i class="${item.icon || 'fas fa-link'}"></i>
                            ${item.title}
                        </h3>
                        <div class="resource-actions">
                            <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="resource-link">
                                <i class="fas fa-external-link-alt"></i>
                            </a>
                            <button class="resource-delete master-mode-only" onclick="resourcesManager.deleteResource('${type}', ${index})" style="display: none;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <p class="resource-description">${item.description || ''}</p>
                    ${item.tags ? `<div class="resource-tags">${item.tags.map(tag => `<span class="resource-tag">${tag}</span>`).join('')}</div>` : ''}
                </div>
            `;
        } else if (type === 'insights') {
            return `
                <div class="resource-card insight-card" data-index="${index}">
                    <div class="insight-header">
                        <span class="insight-date">${item.date || new Date().toLocaleDateString()}</span>
                        <button class="resource-delete master-mode-only" onclick="resourcesManager.deleteResource('${type}', ${index})" style="display: none;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="insight-content">${item.content}</div>
                    ${item.tags ? `<div class="resource-tags">${item.tags.map(tag => `<span class="resource-tag">${tag}</span>`).join('')}</div>` : ''}
                </div>
            `;
        }
    }

    renderResources() {
        // 标签页切换时会自动调用 renderTabContent
        this.renderTabContent('websites');
    }

    async addResource(type, data) {
        if (!document.body.classList.contains('master-mode')) {
            console.warn('仅 Master 模式可添加资源');
            return;
        }

        if (!this.resources[type]) {
            this.resources[type] = [];
        }
        this.resources[type].push(data);
        await this.saveResources(); // 保存到 GitHub Gist
        this.renderTabContent(type);
    }

    async deleteResource(type, index) {
        if (!document.body.classList.contains('master-mode')) {
            console.warn('仅 Master 模式可删除资源');
            return;
        }

        if (this.resources[type] && this.resources[type][index]) {
            // 确认删除
            if (!confirm(`确定要删除 "${this.resources[type][index].title || '此项'}" 吗？`)) {
                return;
            }
            
            this.resources[type].splice(index, 1);
            const success = await this.saveResources(); // 保存到 GitHub Gist
            
            if (success) {
                this.renderTabContent(type);
            } else {
                // 如果保存失败，恢复数据
                this.loadResourcesFromFile();
                this.renderTabContent(type);
                this.showNotification('删除失败，请检查网络连接和 Token 配置', 'error');
            }
        }
    }

    getTabLabel(type) {
        const labels = {
            websites: 'Webs',
            tools: 'Tools',
            insights: 'Thoughts',
            files: 'Files',
            docs: 'Docs'
        };
        return labels[type] || '';
    }

    /**
     * 保存资源到 GitHub Gist（仅在 Master 模式下可用）
     */
    async saveResources() {
        if (!document.body.classList.contains('master-mode')) {
            console.warn('仅 Master 模式可保存资源');
            return false;
        }

        // 检查 GitHub Token 是否配置
        if (!githubStorage.githubToken) {
            this.showNotification('GitHub Token 未配置，无法保存', 'error');
            console.error('GitHub Token 未配置');
            return false;
        }

        try {
            const success = await githubStorage.saveResources(this.resources);
            if (success) {
                this.showNotification('资源已保存到 GitHub', 'success');
                // 重新加载以确保同步
                await this.loadResourcesFromFile();
                this.renderResources();
                return true;
            } else {
                this.showNotification('保存失败，请检查 Token 和网络连接', 'error');
                return false;
            }
        } catch (e) {
            console.error('保存资源失败:', e);
            this.showNotification('保存失败: ' + (e.message || '未知错误'), 'error');
            return false;
        }
    }

    /**
     * 显示通知
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `resource-notification resource-notification-${type}`;
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

// 创建资源添加表单
class ResourceForm {
    constructor() {
        this.createForm();
    }

    createForm() {
        const form = document.createElement('div');
        form.id = 'resource-form-modal';
        form.className = 'modal';
        form.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add Resource</h3>
                    <button class="modal-close" onclick="resourceForm.close()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="resource-form">
                    <div class="form-group">
                        <label>Type</label>
                        <select id="resource-type" required>
                            <option value="websites">Webs</option>
                            <option value="tools">Tools</option>
                            <option value="insights">Thoughts</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" id="resource-title" required>
                    </div>
                    <div class="form-group" id="url-group">
                        <label>URL</label>
                        <input type="url" id="resource-url">
                    </div>
                    <div class="form-group" id="description-group">
                        <label>Description</label>
                        <textarea id="resource-description" rows="3"></textarea>
                    </div>
                    <div class="form-group" id="content-group" style="display: none;">
                        <label>Content</label>
                        <textarea id="resource-content" rows="5"></textarea>
                    </div>
                    <div class="form-group">
                            <label>Tags (comma separated)</label>
                        <input type="text" id="resource-tags" placeholder="e.g.: AI, Learning, Tools">
                    </div>
                    <div class="form-actions">
                        <button type="button" onclick="resourceForm.close()">Cancel</button>
                        <button type="submit">Add</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(form);

        // 绑定表单事件
        document.getElementById('resource-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // 类型切换时显示/隐藏字段
        document.getElementById('resource-type').addEventListener('change', (e) => {
            this.toggleFormFields(e.target.value);
        });
    }

    toggleFormFields(type) {
        const urlGroup = document.getElementById('url-group');
        const descriptionGroup = document.getElementById('description-group');
        const contentGroup = document.getElementById('content-group');

        if (type === 'insights') {
            urlGroup.style.display = 'none';
            descriptionGroup.style.display = 'none';
            contentGroup.style.display = 'block';
        } else {
            urlGroup.style.display = 'block';
            descriptionGroup.style.display = 'block';
            contentGroup.style.display = 'none';
        }
    }

    open() {
        document.getElementById('resource-form-modal').style.display = 'flex';
    }

    close() {
        document.getElementById('resource-form-modal').style.display = 'none';
        document.getElementById('resource-form').reset();
    }

    handleSubmit() {
        const type = document.getElementById('resource-type').value;
        const title = document.getElementById('resource-title').value;
        const url = document.getElementById('resource-url').value;
        const description = document.getElementById('resource-description').value;
        const content = document.getElementById('resource-content').value;
        const tagsInput = document.getElementById('resource-tags').value;

        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

        const data = {
            title,
            tags
        };

        if (type === 'insights') {
            data.content = content;
            data.date = new Date().toLocaleDateString();
        } else {
            data.url = url;
            data.description = description;
        }

        resourcesManager.addResource(type, data).then(() => {
            this.close();
        });
    }
}

// 初始化
const resourcesManager = new ResourcesManager();
const resourceForm = new ResourceForm();

// 添加资源按钮（仅在 Master 模式下显示）
function addResourceButton() {
    // 只在 Master 模式下显示
    if (!document.body.classList.contains('master-mode')) {
        return;
    }
    
    const sections = document.querySelectorAll('.section');
    let resourcesSection = null;
    
    sections.forEach(section => {
        if (section.querySelector('.resources-tabs')) {
            resourcesSection = section;
        }
    });
    
    if (resourcesSection && !resourcesSection.querySelector('.add-resource-button.master-mode')) {
        const addButton = document.createElement('button');
        addButton.className = 'add-resource-button master-mode';
        addButton.innerHTML = '<i class="fas fa-plus"></i> Add Resource';
        addButton.onclick = () => resourceForm.open();
        const content = resourcesSection.querySelector('.section-content');
        if (content) {
            content.appendChild(addButton);
        }
    }
}

// 监听 Master 模式切换
const masterModeObserver = new MutationObserver(() => {
    if (document.body.classList.contains('master-mode')) {
        setTimeout(addResourceButton, 100);
    } else {
        // 退出 Master 模式时移除按钮
        const addButton = document.querySelector('.add-resource-button.master-mode');
        if (addButton) {
            addButton.remove();
        }
    }
});

if (document.body) {
    masterModeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
    });
}

// 等待 DOM 加载完成
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(addResourceButton, 200);
    });
} else {
    setTimeout(addResourceButton, 200);
}

