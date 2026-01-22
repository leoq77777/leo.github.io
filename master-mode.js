/**
 * Master模式 - 开发者模式
 * 通过长按任意子标题 3 秒进入
 * 需要输入密码：qyt123
 */

class MasterMode {
    constructor() {
        this.isActive = false;
        this.pressStartTime = null;
        this.pressTimer = null;
        this.currentTitle = null;
        this.password = 'qyt123';
        this.init();
    }

    init() {
        // 不在初始化时恢复状态，每次打开网页都需要重新激活
        // 清除可能残留的状态
        localStorage.removeItem('master-mode-active');

        // 等待 DOM 加载完成后绑定事件
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.setupPressHandler(), 500);
            });
        } else {
            setTimeout(() => this.setupPressHandler(), 500);
        }
        
        // 页面关闭时清除 Master 模式状态
        window.addEventListener('beforeunload', () => {
            localStorage.removeItem('master-mode-active');
        });

        // 监听 DOM 变化，当 section 被修改后重新绑定
        const domObserver = new MutationObserver(() => {
            this.bindAllTitles();
        });

        // 监听主题切换
        const classObserver = new MutationObserver(() => {
            if (this.isActive) {
                this.updateUI();
            }
        });

        if (document.body) {
            // 监听整个文档的变化
            domObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            classObserver.observe(document.body, {
                attributes: true,
                attributeFilter: ['class']
            });
        }
    }

    bindAllTitles() {
        // 只为 Resources 标题绑定长按事件
        const titles = document.querySelectorAll('.section-title');
        titles.forEach(title => {
            const text = title.textContent.trim();
            // 只绑定 Resources 标题
            if ((text === 'Resources' || text.includes('Resources')) && !title.dataset.masterBound) {
                this.bindPressToTitle(title);
            }
        });
        
        // 也为侧边栏中的 Resources 链接绑定（简约模式下）
        const sidebarLinks = document.querySelectorAll('.sidebar-nav-link');
        sidebarLinks.forEach(link => {
            const linkText = link.textContent.trim();
            // 只绑定 Resources 链接
            if ((linkText === 'Resources' || linkText.includes('Resources')) && !link.dataset.masterBound) {
                this.bindPressToSidebarLink(link);
            }
        });
    }
    
    bindPressToSidebarLink(link) {
        if (link.dataset.masterBound) {
            return;
        }
        
        // 检查是否是 Resources 链接
        const linkText = link.textContent.trim();
        if (!linkText.includes('Resources')) {
            return; // 不是 Resources，不绑定
        }
        
        link.style.cursor = 'pointer';
        link.style.userSelect = 'none';
        
        // 鼠标事件 - 只在长按时触发
        let pressTimer = null;
        const PRESS_DELAY = 100; // 100ms后才认为是长按
        
        link.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // 延迟显示进度条，确保是长按而不是点击
            pressTimer = setTimeout(() => {
                this.handlePressStart(e, null, link);
            }, PRESS_DELAY);
        });
        
        link.addEventListener('mouseup', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
            this.handlePressEnd(e);
        });
        
        link.addEventListener('mouseleave', (e) => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
            this.handlePressCancel(e);
        });
        
        // 触摸事件
        link.addEventListener('touchstart', (e) => {
            e.preventDefault();
            pressTimer = setTimeout(() => {
                this.handlePressStart(e, null, link);
            }, PRESS_DELAY);
        }, { passive: false });
        
        link.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
            this.handlePressEnd(e);
        }, { passive: false });
        
        link.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
            this.handlePressCancel(e);
        }, { passive: false });
        
        link.dataset.masterBound = 'true';
    }

    bindPressToTitle(title) {
        if (title.dataset.masterBound) {
            return; // 已经绑定过了
        }
        
        // 检查是否是 Resources 标题
        const text = title.textContent.trim();
        if (!text.includes('Resources')) {
            return; // 不是 Resources，不绑定
        }
        
        title.style.cursor = 'pointer';
        title.style.userSelect = 'none';
        title.style.position = 'relative';
        
        // 鼠标事件 - 只在长按时触发
        let pressTimer = null;
        const PRESS_DELAY = 100; // 100ms后才认为是长按
        
        title.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // 延迟显示进度条，确保是长按而不是点击
            pressTimer = setTimeout(() => {
                this.handlePressStart(e, title, title);
            }, PRESS_DELAY);
        });
        
        title.addEventListener('mouseup', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
            this.handlePressEnd(e);
        });
        
        title.addEventListener('mouseleave', (e) => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
            this.handlePressCancel(e);
        });
        
        // 触摸事件（移动端）
        title.addEventListener('touchstart', (e) => {
            e.preventDefault();
            pressTimer = setTimeout(() => {
                this.handlePressStart(e, title, title);
            }, PRESS_DELAY);
        }, { passive: false });
        
        title.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
            this.handlePressEnd(e);
        }, { passive: false });
        
        title.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
            this.handlePressCancel(e);
        }, { passive: false });
        
        title.dataset.masterBound = 'true';
    }

    handlePressStart(e, title, target) {
        // 检查是否是 Resources
        const isResources = target.textContent.trim().includes('Resources') || 
                           (title && title.textContent.trim().includes('Resources'));
        
        if (!isResources) {
            // 不是 Resources，不处理
            return;
        }
        
        // 如果已经是 Master 模式，长按退出
        if (this.isActive) {
            this.currentTarget = target;
            this.pressStartTime = Date.now();
            this.showRingProgress(target);
            this.pressTimer = setTimeout(() => {
                this.deactivate();
                this.hideRingProgress();
            }, 3000);
            return;
        }

        this.currentTarget = target;
        this.pressStartTime = Date.now();
        
        // 显示环绕进度条
        this.showRingProgress(target);
        
        // 3秒后触发（只有 Resources 才会执行到这里）
        this.pressTimer = setTimeout(() => {
            this.pressStartTime = null;
            this.hideRingProgress();
            this.showPasswordModal();
        }, 3000);
    }

    handlePressEnd(e) {
        if (this.pressTimer) {
            clearTimeout(this.pressTimer);
            this.pressTimer = null;
        }
        
        this.hideRingProgress();
        this.pressStartTime = null;
        this.currentTarget = null;
    }

    handlePressCancel(e) {
        this.handlePressEnd(e);
    }

    showRingProgress(target) {
        // 移除旧的进度条
        this.hideRingProgress();
        
        if (!target) return;
        
        // 获取目标的尺寸和位置
        const rect = target.getBoundingClientRect();
        const padding = 8; // 进度条距离边框的距离
        const width = Math.max(rect.width, 100); // 最小宽度
        const height = Math.max(rect.height, 30); // 最小高度
        const radius = 8; // 圆角半径
        const perimeter = (width + height) * 2 - radius * 8 + Math.PI * radius * 2; // 矩形周长（考虑圆角）
        
        // 创建环绕进度条容器（使用 fixed 定位，相对于视口）
        const progressContainer = document.createElement('div');
        progressContainer.className = 'master-ring-progress';
        progressContainer.style.cssText = `
            position: fixed;
            top: ${rect.top - padding}px;
            left: ${rect.left - padding}px;
            width: ${width + padding * 2}px;
            height: ${height + padding * 2}px;
            pointer-events: none;
            z-index: 9999;
        `;
        
        // 创建 SVG 进度环
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const svgWidth = width + padding * 2;
        const svgHeight = height + padding * 2;
        svg.setAttribute('width', svgWidth);
        svg.setAttribute('height', svgHeight);
        svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
        svg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            overflow: visible;
        `;
        
        // 创建路径（圆角矩形边框，从左上角开始顺时针）
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const x = padding;
        const y = padding;
        const w = width;
        const h = height;
        const r = radius;
        
        // 圆角矩形路径：从左上角开始，顺时针
        const d = `M ${x + r},${y} 
                   L ${x + w - r},${y} 
                   Q ${x + w},${y} ${x + w},${y + r} 
                   L ${x + w},${y + h - r} 
                   Q ${x + w},${y + h} ${x + w - r},${y + h} 
                   L ${x + r},${y + h} 
                   Q ${x},${y + h} ${x},${y + h - r} 
                   L ${x},${y + r} 
                   Q ${x},${y} ${x + r},${y} Z`;
        
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#212529');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('stroke-dasharray', perimeter);
        path.setAttribute('stroke-dashoffset', perimeter);
        path.id = 'master-progress-path';
        
        svg.appendChild(path);
        progressContainer.appendChild(svg);
        document.body.appendChild(progressContainer);
        
        // 触发动画 - 确保动画可见
        setTimeout(() => {
            const pathEl = document.getElementById('master-progress-path');
            if (pathEl) {
                // 先重置以确保动画可见
                pathEl.setAttribute('stroke-dashoffset', perimeter);
                pathEl.style.transition = 'none';
                
                // 强制重绘
                pathEl.offsetHeight;
                
                // 然后应用动画
                requestAnimationFrame(() => {
                    pathEl.style.transition = 'stroke-dashoffset 3s linear';
                    pathEl.setAttribute('stroke-dashoffset', '0');
                });
            }
        }, 10);
        
        // 保存引用以便后续移除
        target._progressContainer = progressContainer;
    }

    hideRingProgress() {
        if (this.currentTarget && this.currentTarget._progressContainer) {
            this.currentTarget._progressContainer.remove();
            this.currentTarget._progressContainer = null;
        }
        
        // 也移除所有可能残留的进度条
        document.querySelectorAll('.master-ring-progress').forEach(el => el.remove());
    }

    setupPressHandler() {
        // 立即绑定所有标题
        this.bindAllTitles();

        // 定期检查（资源部分可能延迟加载）
        let checkCount = 0;
        const checkInterval = setInterval(() => {
            this.bindAllTitles();
            checkCount++;
            // 最多检查20次（10秒）
            if (checkCount >= 20) {
                clearInterval(checkInterval);
            }
        }, 500);
    }

    showPasswordModal() {
        // 创建密码输入模态框
        const modal = document.createElement('div');
        modal.className = 'master-password-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 400px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <h2 style="margin-top: 0; margin-bottom: 1.5rem; text-align: center;">Master 模式</h2>
                <p style="color: #666; margin-bottom: 1.5rem; text-align: center;">请输入密码以进入开发者模式</p>
                <input type="password" id="master-password-input" placeholder="输入密码" 
                       style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; margin-bottom: 1rem; box-sizing: border-box;"
                       autofocus>
                <div id="password-error" style="color: #dc3545; font-size: 0.875rem; margin-bottom: 1rem; display: none;"></div>
                <div style="display: flex; gap: 1rem;">
                    <button id="password-submit" style="flex: 1; padding: 0.75rem; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
                        确认
                    </button>
                    <button id="password-cancel" style="flex: 1; padding: 0.75rem; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        取消
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const passwordInput = document.getElementById('master-password-input');
        const errorDiv = document.getElementById('password-error');
        const submitBtn = document.getElementById('password-submit');
        const cancelBtn = document.getElementById('password-cancel');

        // 提交密码
        const submitPassword = () => {
            const inputPassword = passwordInput.value.trim();
            if (inputPassword === this.password) {
                modal.remove();
                this.activate();
            } else {
                errorDiv.textContent = '密码错误，请重试';
                errorDiv.style.display = 'block';
                passwordInput.value = '';
                passwordInput.focus();
            }
        };

        // 绑定事件
        submitBtn.onclick = submitPassword;
        cancelBtn.onclick = () => modal.remove();
        
        passwordInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                submitPassword();
            }
        };

        // 点击背景关闭
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };

        // 聚焦输入框
        setTimeout(() => passwordInput.focus(), 100);
    }

    activate() {
        this.isActive = true;
        // 不保存到 localStorage，关闭网页时自动退出
        document.body.classList.add('master-mode');
        this.updateUI();
    }

    deactivate() {
        this.isActive = false;
        // 清除 localStorage
        localStorage.removeItem('master-mode-active');
        document.body.classList.remove('master-mode');
        this.updateUI();
    }

    updateUI() {
        if (this.isActive) {
            this.showAddResourceButton();
        } else {
            this.hideAddResourceButton();
        }
    }

    showAddResourceButton() {
        // 检查是否已存在按钮
        if (document.querySelector('.add-resource-button.master-mode')) {
            return;
        }

        const sections = document.querySelectorAll('.section');
        let resourcesSection = null;
        
        sections.forEach(section => {
            if (section.querySelector('.resources-tabs')) {
                resourcesSection = section;
            }
        });
        
        if (resourcesSection) {
            const addButton = document.createElement('button');
            addButton.className = 'add-resource-button master-mode';
            addButton.innerHTML = '<i class="fas fa-plus"></i> 添加资源';
            addButton.onclick = () => {
                if (typeof resourceForm !== 'undefined') {
                    resourceForm.open();
                }
            };
            const content = resourcesSection.querySelector('.section-content');
            if (content && !content.querySelector('.add-resource-button.master-mode')) {
                content.appendChild(addButton);
            }
        }
    }

    hideAddResourceButton() {
        const button = document.querySelector('.add-resource-button.master-mode');
        if (button) {
            button.remove();
        }
    }

    showNotification(message, type = 'info') {
        // Master 模式通知更低调，不显示给普通用户
        if (!this.isActive && type !== 'success') return;
        
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `master-notification master-notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : '#17a2b8'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            animation: slideInRight 0.3s ease;
        `;

        // 添加动画样式
        if (!document.querySelector('#master-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'master-notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // 3秒后自动移除
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// 初始化Master模式
const masterMode = new MasterMode();
