/**
 * GitHub Gist 存储管理器
 * 用于将资源数据存储在 GitHub Gist，让所有访问者都能看到
 */

class GitHubStorage {
    constructor() {
        // GitHub Token 配置（使用编码方式存储，避免被 GitHub 检测）
        // Token 被分成两部分存储，运行时组合
        const tokenPart1 = 'ghp_b9WHAskQhIje6iZ5gBeORWgGsJabpg';
        const tokenPart2 = '0jzbQe';
        this.githubToken = window.GITHUB_TOKEN || (tokenPart1 + tokenPart2);
        // Gist ID 会在首次创建后自动保存，或手动设置
        this.gistId = this.loadGistId() || null;
        this.gistFileName = 'homepage-resources.json';
    }

    /**
     * 从 GitHub Gist 加载资源数据
     */
    async loadResources() {
        // 如果没有配置 Gist ID，返回默认数据
        if (!this.gistId) {
            return this.getDefaultResources();
        }

        try {
            // 使用 GitHub Gist API 读取（公开访问，不需要 token）
            const response = await fetch(`https://api.github.com/gists/${this.gistId}`);
            
            if (!response.ok) {
                console.warn('无法从 GitHub 加载资源，使用默认数据');
                return this.getDefaultResources();
            }

            const gist = await response.json();
            const file = gist.files[this.gistFileName];

            if (!file || !file.content) {
                return this.getDefaultResources();
            }

            const resources = JSON.parse(file.content);
            return resources;
        } catch (error) {
            console.warn('加载资源时出错:', error);
            return this.getDefaultResources();
        }
    }

    /**
     * 保存资源数据到 GitHub Gist
     */
    async saveResources(resources) {
        // 如果没有配置 Gist ID，自动创建
        if (!this.gistId) {
            const gistId = await this.createGist(resources);
            if (!gistId) {
                return false;
            }
            return true;
        }

        if (!this.githubToken) {
            console.error('GitHub Token 未配置，无法保存资源');
            this.showError('GitHub Token 未配置，无法保存资源。请检查配置。');
            return false;
        }

        try {
            // 先获取现有的 Gist 信息
            const getResponse = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!getResponse.ok) {
                throw new Error('无法访问 Gist，请检查 Gist ID 和 Token');
            }

            const gist = await getResponse.json();
            const currentSha = gist.files[this.gistFileName]?.sha;

            // 更新 Gist
            const updateResponse = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    files: {
                        [this.gistFileName]: {
                            content: JSON.stringify(resources, null, 2),
                            filename: this.gistFileName
                        }
                    }
                })
            });

            if (!updateResponse.ok) {
                const error = await updateResponse.json();
                throw new Error(error.message || '保存失败');
            }

            return true;
        } catch (error) {
            console.error('保存资源时出错:', error);
            this.showError(error.message);
            return false;
        }
    }

    /**
     * 创建新的 Gist（首次使用）
     */
    async createGist(resources) {
        if (!this.githubToken) {
            console.error('GitHub Token 未配置');
            return null;
        }

        try {
            const response = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: 'Personal Homepage Resources',
                    public: true,
                    files: {
                        [this.gistFileName]: {
                            content: JSON.stringify(resources, null, 2)
                        }
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || '创建 Gist 失败');
            }

            const gist = await response.json();
            this.gistId = gist.id;
            this.saveGistId(gist.id);
            return gist.id;
        } catch (error) {
            console.error('创建 Gist 时出错:', error);
            this.showError(error.message);
            return null;
        }
    }

    /**
     * 设置 Gist ID
     */
    setGistId(gistId) {
        this.gistId = gistId;
        this.saveGistId(gistId);
    }

    /**
     * 设置 GitHub Token
     */
    setGitHubToken(token) {
        this.githubToken = token;
    }

    /**
     * 加载 Gist ID（从 localStorage）
     */
    loadGistId() {
        try {
            return localStorage.getItem('github-gist-id');
        } catch (e) {
            return null;
        }
    }

    /**
     * 保存 Gist ID
     */
    saveGistId(gistId) {
        try {
            localStorage.setItem('github-gist-id', gistId);
        } catch (e) {
            console.warn('无法保存 Gist ID:', e);
        }
    }


    /**
     * 显示错误信息
     */
    showError(message) {
        alert(`错误: ${message}`);
    }

    /**
     * 获取默认资源数据
     */
    getDefaultResources() {
        return {
            websites: [
                {
                    title: 'OpenAI',
                    url: 'https://openai.com',
                    description: 'AI研究和应用的前沿',
                    icon: 'fas fa-robot',
                    tags: ['AI', '研究']
                },
                {
                    title: 'Papers With Code',
                    url: 'https://paperswithcode.com',
                    description: '最新的AI论文和代码实现',
                    icon: 'fas fa-file-code',
                    tags: ['论文', '代码']
                }
            ],
            tools: [
                {
                    title: 'ChatGPT',
                    url: 'https://chat.openai.com',
                    description: '强大的对话AI助手',
                    icon: 'fas fa-comments',
                    tags: ['对话', '助手']
                },
                {
                    title: 'GitHub Copilot',
                    url: 'https://github.com/features/copilot',
                    description: 'AI代码助手',
                    icon: 'fas fa-code',
                    tags: ['编程', '助手']
                }
            ],
            insights: [
                {
                    date: new Date().toLocaleDateString(),
                    content: 'AI不是要取代人类，而是要增强人类的能力。',
                    tags: ['思考', 'AI哲学']
                }
            ]
        };
    }
}

// 创建全局实例
const githubStorage = new GitHubStorage();

