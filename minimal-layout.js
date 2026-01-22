/**
 * 简约主题布局管理器
 * 创建左侧边栏导航，实现分页显示
 */

class MinimalLayoutManager {
    constructor() {
        this.sections = [];
        this.currentPage = 0;
        this.init();
    }

    init() {
        // 等待 DOM 加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // 始终使用简约模式布局
        this.createSidebar();
        this.setupPagination();
        this.setupNavigation();
    }

    createSidebar() {
        // 检查是否已存在
        if (document.querySelector('.sidebar')) return;

        // 收集所有section（包括header作为首页）
        this.sections = [];
        
        // 添加header作为首页
        const header = document.querySelector('.header');
        if (header) {
            this.sections.push({
                element: header,
                title: 'Home',
                icon: 'fas fa-home',
                id: 'home'
            });
        }

        // 收集所有section
        const sections = Array.from(document.querySelectorAll('.section')).map(section => {
            const titleElement = section.querySelector('.section-title');
            if (!titleElement) return null;
            
            const icon = titleElement.querySelector('i');
            const text = titleElement.textContent.trim();
            const iconClass = icon ? icon.className : '';
            
            return {
                element: section,
                title: text,
                icon: iconClass,
                id: this.generateId(text)
            };
        }).filter(Boolean);

        this.sections = this.sections.concat(sections);

        // 创建侧边栏
        const sidebar = document.createElement('aside');
        sidebar.className = 'sidebar';
        sidebar.innerHTML = `
            <nav>
                <ul class="sidebar-nav">
                    ${this.sections.map((section, index) => `
                        <li class="sidebar-nav-item">
                            <a href="#${section.id}" class="sidebar-nav-link ${index === 0 ? 'active' : ''}" data-page-index="${index}">
                                <i class="${section.icon}"></i>
                                <span>${section.title}</span>
                            </a>
                        </li>
                    `).join('')}
                </ul>
            </nav>
        `;

        // 为每个section添加ID
        this.sections.forEach(section => {
            if (!section.element.id) {
                section.element.id = section.id;
            }
        });

        // 插入侧边栏
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(sidebar, container.firstChild);
            
            // 包装主内容
            const header = container.querySelector('.header');
            const contentGrid = container.querySelector('.content-grid');
            const footer = container.querySelector('.footer');
            
            if (header || contentGrid || footer) {
                const mainContent = document.createElement('div');
                mainContent.className = 'main-content';
                
                if (header) {
                    container.removeChild(header);
                    mainContent.appendChild(header);
                }
                if (contentGrid) {
                    container.removeChild(contentGrid);
                    mainContent.appendChild(contentGrid);
                }
                if (footer) {
                    container.removeChild(footer);
                    mainContent.appendChild(footer);
                }
                
                container.appendChild(mainContent);
            }
        }
    }

    setupPagination() {
        // 简约模式下，只显示当前页面的内容
        this.showPage(0);
    }

    showPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= this.sections.length) return;
        
        this.currentPage = pageIndex;
        
        // 隐藏所有section
        this.sections.forEach((section, index) => {
            if (index === 0) {
                // 首页（header）
                section.element.style.display = index === pageIndex ? 'block' : 'none';
            } else {
                // 其他section
                section.element.style.display = index === pageIndex ? 'block' : 'none';
            }
        });

        // 更新导航高亮
        const navLinks = document.querySelectorAll('.sidebar-nav-link');
        navLinks.forEach((link, index) => {
            link.classList.toggle('active', index === pageIndex);
        });
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.sidebar-nav-link');
        
        navLinks.forEach((link, index) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showPage(index);
                
                // 更新URL hash（可选）
                const sectionId = this.sections[index].id;
                window.history.pushState(null, '', `#${sectionId}`);
            });
        });

        // 处理浏览器前进后退
        window.addEventListener('popstate', () => {
            const hash = window.location.hash.slice(1);
            const pageIndex = this.sections.findIndex(s => s.id === hash);
            if (pageIndex >= 0) {
                this.showPage(pageIndex);
            }
        });

        // 处理初始hash
        if (window.location.hash) {
            const hash = window.location.hash.slice(1);
            const pageIndex = this.sections.findIndex(s => s.id === hash);
            if (pageIndex >= 0) {
                this.showPage(pageIndex);
            }
        }
    }

    generateId(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
}

// 初始化布局管理器
const minimalLayoutManager = new MinimalLayoutManager();
