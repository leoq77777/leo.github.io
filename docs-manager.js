/**
 * 文档管理器
 * 从 docs/ 目录读取 Markdown 文件并显示
 */

class DocsManager {
    constructor() {
        this.docs = [];
        this.currentDoc = null;
        this.docsPath = 'docs/';
        this.marked = null; // marked.js 实例
        
        // 加载 marked.js
        this.loadMarked().then(() => {
            this.init();
        });
    }

    async loadMarked() {
        // 如果 marked 已加载，直接返回
        if (window.marked) {
            this.marked = window.marked;
            return;
        }

        // 从 CDN 加载 marked.js
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js';
            script.onload = () => {
                this.marked = window.marked;
                // 配置 marked
                if (this.marked) {
                    this.marked.setOptions({
                        breaks: true,
                        gfm: true,
                        headerIds: true,
                        mangle: false
                    });
                }
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async init() {
        await this.loadDocsList();
        this.createDocsSection();
        // 文档现在集成在 Resources 标签页中，不需要单独创建 section
    }

    /**
     * 加载文档列表
     */
    async loadDocsList() {
        try {
            // 优先从 docs/index.json 读取文件列表
            const response = await fetch(`${this.docsPath}index.json`);
            if (response.ok) {
                const data = await response.json();
                this.docs = data.files || [];
                return;
            }
        } catch (error) {
            console.warn('无法加载 index.json:', error);
        }

        // 如果 index.json 不存在，尝试从 GitHub API 获取
        try {
            this.docs = await this.fetchDocsFromGitHub();
            if (this.docs.length > 0) {
                return;
            }
        } catch (error) {
            console.warn('无法从 GitHub API 获取文档列表:', error);
        }

        // 如果都失败，使用默认列表
        this.docs = [
            { name: 'example.md', title: 'Example' },
            { name: 'README.md', title: 'README' }
        ];
    }

    /**
     * 从 GitHub API 获取文档列表
     */
    async fetchDocsFromGitHub() {
        // GitHub API 获取仓库内容
        // 格式: https://api.github.com/repos/{owner}/{repo}/contents/{path}
        const repo = 'leoq77777/leo.github.io';
        const path = 'docs';
        
        try {
            const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`);
            if (!response.ok) {
                throw new Error(`GitHub API 错误: ${response.status}`);
            }

            const files = await response.json();
            // 过滤出 .md 文件
            const mdFiles = files
                .filter(file => file.name.endsWith('.md') && file.type === 'file')
                .map(file => ({
                    name: file.name,
                    title: this.getTitleFromFileName(file.name),
                    sha: file.sha
                }));

            return mdFiles;
        } catch (error) {
            console.error('从 GitHub API 获取文档列表失败:', error);
            return [];
        }
    }

    /**
     * 创建文档部分（集成到 Resources 标签页）
     */
    createDocsSection() {
        // 文档现在集成在 Resources 的 Docs 标签页中
        // 这个方法保留用于初始化，但实际渲染在 renderInPanel 中
        this.initialized = true;
    }

    /**
     * 在指定的面板中渲染文档
     */
    renderInPanel(panel) {
        if (!panel) {
            console.warn('Panel not found for docs rendering');
            return;
        }

        // 如果面板已经有内容且是查看器模式，不重新渲染
        const existingViewer = panel.querySelector('.docs-viewer');
        if (existingViewer && existingViewer.style.display !== 'none') {
            return;
        }

        // 确保文档列表已加载
        if (this.docs.length === 0) {
            // 如果文档列表为空，重新加载
            this.loadDocsList().then(() => {
                this.renderInPanel(panel);
            });
            return;
        }

        // 渲染文档列表
        panel.innerHTML = `
            <div class="docs-container">
                <div class="docs-list" id="docs-list"></div>
                <div class="docs-viewer" id="docs-viewer" style="display: none;">
                    <button class="docs-back-btn" onclick="docsManager.closeViewer()">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    <div class="docs-content" id="docs-content"></div>
                </div>
            </div>
        `;

        this.renderDocsList();
    }

    /**
     * 查找或创建文档部分
     */
    findOrCreateDocsSection() {
        // 查找现有的文档部分
        const sections = document.querySelectorAll('.section');
        for (let section of sections) {
            const title = section.querySelector('.section-title');
            if (title && (title.textContent.includes('Docs') || title.textContent.includes('文档'))) {
                return section;
            }
        }

        // 如果没有找到，在 Resources 后面创建一个
        const contentGrid = document.querySelector('.content-grid');
        if (!contentGrid) {
            // 如果 content-grid 不存在，等待一下再试
            setTimeout(() => {
                const section = this.findOrCreateDocsSection();
                if (section) {
                    this.createDocsSection();
                }
            }, 500);
            return null;
        }

        const newSection = document.createElement('article');
        newSection.className = 'section';
        newSection.setAttribute('onmouseenter', 'expandSection(this)');
        newSection.setAttribute('onmouseleave', 'collapseSection(this)');
        newSection.innerHTML = `
            <h2 class="section-title">
                <i class="fas fa-file-alt" aria-hidden="true"></i>
                Docs
            </h2>
            <div class="section-content"></div>
        `;
        
        // 插入到 Resources 部分之后
        const resourcesSection = Array.from(sections).find(section => {
            const title = section.querySelector('.section-title');
            return title && title.textContent.includes('Resources');
        });
        
        if (resourcesSection && resourcesSection.nextSibling) {
            contentGrid.insertBefore(newSection, resourcesSection.nextSibling);
        } else {
            contentGrid.appendChild(newSection);
        }
        
        return newSection;
    }

    /**
     * 渲染文档列表
     */
    renderDocsList() {
        const docsList = document.getElementById('docs-list');
        if (!docsList) {
            console.warn('docs-list element not found');
            return;
        }

        console.log('Rendering docs list, count:', this.docs.length);
        console.log('Docs:', this.docs);

        if (this.docs.length === 0) {
            docsList.innerHTML = `
                <div class="docs-empty">
                    <i class="fas fa-inbox"></i>
                    <p>暂无文档</p>
                    <p class="docs-hint">在 <code>docs/</code> 目录下添加 Markdown 文件即可显示</p>
                </div>
            `;
            return;
        }

        docsList.innerHTML = this.docs.map(doc => {
            const title = doc.title || this.getTitleFromFileName(doc.name);
            return `
                <div class="docs-item" onclick="docsManager.openDoc('${doc.name}')">
                    <i class="fas fa-file-alt"></i>
                    <span class="docs-item-title">${title}</span>
                    <i class="fas fa-chevron-right docs-item-arrow"></i>
                </div>
            `;
        }).join('');
    }

    /**
     * 从文件名获取标题
     */
    getTitleFromFileName(fileName) {
        // 移除 .md 扩展名
        let title = fileName.replace(/\.md$/, '');
        // 将连字符和下划线替换为空格
        title = title.replace(/[-_]/g, ' ');
        // 首字母大写
        return title.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    /**
     * 打开文档
     */
    async openDoc(fileName) {
        try {
            const response = await fetch(`${this.docsPath}${fileName}`);
            if (!response.ok) {
                throw new Error(`无法加载文档: ${fileName}`);
            }

            const markdown = await response.text();
            const html = this.marked.parse(markdown);

            // 显示文档查看器
            const docsList = document.getElementById('docs-list');
            const docsViewer = document.getElementById('docs-viewer');
            const docsContent = document.getElementById('docs-content');
            
            if (docsList) docsList.style.display = 'none';
            if (docsViewer) {
                docsViewer.style.display = 'block';
                if (docsContent) docsContent.innerHTML = html;
            }

            // 高亮代码块（如果 highlight.js 可用）
            this.highlightCode();

            // 滚动到顶部
            if (docsViewer) {
                docsViewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } catch (error) {
            console.error('加载文档失败:', error);
            alert('加载文档失败: ' + error.message);
        }
    }

    /**
     * 关闭文档查看器
     */
    closeViewer() {
        const docsList = document.getElementById('docs-list');
        const docsViewer = document.getElementById('docs-viewer');
        
        if (docsList) docsList.style.display = 'block';
        if (docsViewer) {
            docsViewer.style.display = 'none';
            const content = document.getElementById('docs-content');
            if (content) content.innerHTML = '';
        }
    }

    /**
     * 高亮代码块
     */
    highlightCode() {
        // 如果 highlight.js 可用，使用它来高亮代码
        if (window.hljs) {
            document.querySelectorAll('pre code').forEach(block => {
                hljs.highlightElement(block);
            });
        }
    }
}

// 创建全局实例
const docsManager = new DocsManager();
