// 头像动画效果
function animateAvatar() {
    const avatar = document.querySelector('.avatar');
    avatar.style.transform = 'rotate(360deg) scale(1.1)';
    setTimeout(() => {
        avatar.style.transform = 'scale(1.05)';
    }, 500);

    showToast('Rooootating');
}

// 鼠标跟随效果
const mouseFollowElement = document.querySelector('.mouse-follow');
if (mouseFollowElement) {
    document.addEventListener('mousemove', (e) => {
        mouseFollowElement.style.left = `${e.clientX - 15}px`;
        mouseFollowElement.style.top = `${e.clientY - 15}px`;
    });
}

// 显示提示信息
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, var(--accent), var(--accent-2));
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        z-index: 1000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
        backdrop-filter: blur(10px);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 2000);
}

// 鼠标进入展开联系方式
function expandContact(element) {
    element.classList.add('expanded');
    element.style.transform = 'translateY(-3px) scale(1.02)';
    element.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';

    const contactValue = element.querySelector('.contact-value');
    if (contactValue) {
        contactValue.style.display = 'block';
        contactValue.style.opacity = '1';
        contactValue.style.transform = 'translateY(0)';
    }
}

// 鼠标离开收起联系方式
function collapseContact(element) {
    element.classList.remove('expanded');
    element.style.transform = 'translateY(0) scale(1)';
    element.style.boxShadow = 'none';

    const contactValue = element.querySelector('.contact-value');
    if (contactValue) {
        contactValue.style.display = 'none';
        contactValue.style.opacity = '0';
        contactValue.style.transform = 'translateY(5px)';
    }
}

// 点击联系方式处理
function handleContactClick(element) {
    const contactType = element.dataset.contact;
    const value = element.dataset.value;
    const url = element.dataset.url;

    if (contactType === 'email') {
        navigator.clipboard.writeText(value).then(() => {
            showToast('Mail Address Copied to clipboard: ' + value);
        }).catch(() => {
            showToast('Copy failed, please copy manually.');
        });
    } else {
        window.open(url, '_blank');
    }
}

// 悬停展开卡片
function expandSection(element) {
    element.classList.remove('collapsed');
    element.style.height = 'auto';

    // 强制重绘以触发CSS transition
    void element.offsetWidth;

    // 确保内容可见
    const content = element.querySelector('.section-content');
    if (content) {
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
    }

    // 确保skill-grid可见
    const skillGrid = element.querySelector('.skill-grid');
    if (skillGrid) {
        skillGrid.style.opacity = '1';
        skillGrid.style.transform = 'translateY(0)';
    }

    // 确保列表可见
    const lists = element.querySelectorAll('.project-list, .hobby-list');
    lists.forEach(list => {
        list.style.opacity = '1';
        list.style.transform = 'translateY(0)';
    });

    // 确保skill-card可见
    const skillCards = element.querySelectorAll('.skill-card');
    skillCards.forEach((card, index) => {
        card.style.opacity = '1';
        card.style.transform = 'translateX(0)';
        card.style.transitionDelay = (0.3 + index * 0.1) + 's';
    });

    // 确保列表项可见
    const listItems = element.querySelectorAll('.project-list li, .hobby-list li');
    listItems.forEach((item, index) => {
        item.style.opacity = '1';
        item.style.transform = 'translateX(0)';
        item.style.transitionDelay = (0.3 + index * 0.1) + 's';
    });
}

// 鼠标离开收起卡片
function collapseSection(element) {
    element.classList.add('collapsed');
    // 强制设置高度为120px以确保正确收起
    element.style.height = '120px';

    // 确保内容隐藏
    const content = element.querySelector('.section-content');
    if (content) {
        content.style.opacity = '0';
        content.style.transform = 'translateY(20px)';
    }

    // 确保skill-grid隐藏
    const skillGrid = element.querySelector('.skill-grid');
    if (skillGrid) {
        skillGrid.style.opacity = '0';
        skillGrid.style.transform = 'translateY(20px)';
    }

    // 确保列表隐藏
    const lists = element.querySelectorAll('.project-list, .hobby-list');
    lists.forEach(list => {
        list.style.opacity = '0';
        list.style.transform = 'translateY(20px)';
    });

    // 确保skill-card隐藏
    const skillCards = element.querySelectorAll('.skill-card');
    skillCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-20px)';
    });

    // 确保列表项隐藏
    const listItems = element.querySelectorAll('.project-list li, .hobby-list li');
    listItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
    });
}

// 点击详细信息时的处理
document.querySelectorAll('.contact-item').forEach(item => {
    item.addEventListener('click', function(e) {
        if (e.target.classList.contains('contact-value')) {
            const contactType = this.dataset.contact;
            const value = this.dataset.value;
            const url = this.dataset.url;

            if (contactType === 'email') {
                navigator.clipboard.writeText(value).then(() => {
                    showToast('邮箱地址已复制到剪贴板！');
                    window.location.href = url;
                }).catch(() => {
                    window.location.href = url;
                });
            } else {
                window.open(url, '_blank');
            }
        }
    });
});

// 点击页面其他地方收起所有联系方式
document.addEventListener('click', (e) => {
    const contactItems = document.querySelectorAll('.contact-item');
    contactItems.forEach(item => {
        const value = item.querySelector('.contact-value');
        if (value && value.style.display === 'block' && !item.contains(e.target)) {
            item.classList.remove('expanded');
            value.style.display = 'none';
        }
    });
});

// 页面滚动动画
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// 滚动时的视差效果
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const nebula = document.querySelector('.nebula');
    const stars = document.querySelector('.stars');

    if (nebula) {
        nebula.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
    if (stars) {
        stars.style.transform = `translateY(${scrolled * 0.2}px)`;
    }
});

// 鼠标跟随效果
document.addEventListener('mousemove', (e) => {
    const sections = document.querySelectorAll('.section');
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    sections.forEach((section, index) => {
        const intensity = (index + 1) * 0.5;
        section.style.transform = `translate(${x * intensity}px, ${y * intensity}px)`;
    });
});

// 页面加载完成后的动画
window.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.section');
    sections.forEach((section, index) => {
        // 立即设置所有元素为隐藏状态，防止闪烁
        section.classList.add('collapsed');
        section.style.height = '120px';
        section.style.overflow = 'hidden';

        // 确保所有内容立即隐藏
        const content = section.querySelector('.section-content');
        if (content) {
            content.style.opacity = '0';
            content.style.transform = 'translateY(20px)';
            content.style.display = 'block';
        }

        const skillGrid = section.querySelector('.skill-grid');
        if (skillGrid) {
            skillGrid.style.opacity = '0';
            skillGrid.style.transform = 'translateY(20px)';
            skillGrid.style.display = 'grid';
        }

        const lists = section.querySelectorAll('.project-list, .hobby-list');
        lists.forEach(list => {
            list.style.opacity = '0';
            list.style.transform = 'translateY(20px)';
            list.style.display = 'block';
        });

        const skillCards = section.querySelectorAll('.skill-card');
        skillCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateX(-20px)';
            card.style.display = 'flex';
        });

        const listItems = section.querySelectorAll('.project-list li, .hobby-list li');
        listItems.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            item.style.display = 'flex';
        });

        // 强制重绘，确保隐藏状态立即生效
        void section.offsetWidth;
    });
});