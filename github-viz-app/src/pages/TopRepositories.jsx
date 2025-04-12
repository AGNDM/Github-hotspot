import { useState, useEffect, useMemo } from 'react';
import API from '../config/api';

// 根据语言名称生成颜色
const getLanguageColor = (language) => {
    const colorMap = {
        JavaScript: '#f1e05a',
        TypeScript: '#2b7489',
        Python: '#3572A5',
        Java: '#b07219',
        Go: '#00ADD8',
        'C++': '#f34b7d',
        Ruby: '#701516',
        Dart: '#00B4AB',
        PHP: '#4F5D95',
        Rust: '#dea584',
        'C#': '#178600',
        Swift: '#ffac45',
        Kotlin: '#F18E33'
    };

    return colorMap[language] ||
        `hsl(${Math.abs(language.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 360}, 70%, 60%)`;
};

// 模拟数据，当API不可用时使用
const mockData = [
    {
        repo_id: 1,
        name: 'react',
        description: '用于构建用户界面的JavaScript库',
        stars: 182000,
        forks: 35800,
        language: 'JavaScript',
        owner: 'facebook',
        stars_month_ago: 180000
    },
    {
        repo_id: 2,
        name: 'vue',
        description: '渐进式JavaScript框架',
        stars: 153000,
        forks: 29500,
        language: 'JavaScript',
        owner: 'vuejs',
        stars_month_ago: 151000
    },
    {
        repo_id: 3,
        name: 'tensorflow',
        description: '机器学习框架',
        stars: 147000,
        forks: 83600,
        language: 'Python',
        owner: 'tensorflow',
        stars_month_ago: 146000
    },
    {
        repo_id: 4,
        name: 'flutter',
        description: 'Google的UI工具包，用于从单一代码库构建移动、Web和桌面应用',
        stars: 139000,
        forks: 21700,
        language: 'Dart',
        owner: 'flutter',
        stars_month_ago: 137000
    },
    {
        repo_id: 5,
        name: 'vscode',
        description: 'Visual Studio Code',
        stars: 132000,
        forks: 23800,
        language: 'TypeScript',
        owner: 'microsoft',
        stars_month_ago: 130000
    },
    {
        repo_id: 6,
        name: 'kubernetes',
        description: '容器编排系统',
        stars: 126000,
        forks: 45900,
        language: 'Go',
        owner: 'kubernetes',
        stars_month_ago: 125000
    }
];

const TopRepositories = () => {
    const [repositories, setRepositories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('stars');
    const [filter, setFilter] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [hoveredRepo, setHoveredRepo] = useState(null);
    const [isUsingMockData, setIsUsingMockData] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const response = await fetch(API.topRepositories);
                if (!response.ok) throw new Error('获取数据失败');
                const result = await response.json();
                //console.log('API Result:', result);//打印API结果
                setRepositories(result);
                setIsUsingMockData(false);
            } catch (err) {
                console.error('获取最受欢迎仓库数据出错:', err);
                // 使用模拟数据作为后备
                setRepositories(mockData);
                setIsUsingMockData(true);
                setError(null); // 清除错误状态，因为我们使用了模拟数据
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    // 提取所有语言 (基于完整数据)
    const availableLanguages = useMemo(() => {
        const languages = new Set();
        repositories.forEach(repo => {
            if (repo.language) languages.add(repo.language);
        });
        return Array.from(languages).sort();
    }, [repositories]);

    // 计算一个月内星标增长率
    const calculateGrowthRate = (repo) => {
        // 使用后端返回的 'stars_month_ago' 字段
        if (repo.stars_month_ago === null || repo.stars_month_ago === undefined || repo.stars_month_ago === 0) return 0; // 如果没有7天前数据或为0，则增长率为0
        const growth = (repo.stars || 0) - repo.stars_month_ago;
        // 避免除以零，如果7天前星标为0，增长率视为无限大或特殊值，这里简单处理为大幅增长或0
        const baseStars = repo.stars_month_ago || 1; // 防止除以0
        const rate = (growth / baseStars) * 100;
        return rate.toFixed(1);
    };

    // 格式化数字
    const formatNumber = (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num ? num.toString() : '0';
    };

    // 步骤 1 & 2: 过滤（语言）和排序完整数据
    const filteredSortedFullRepos = useMemo(() => {
        let result = [...repositories];

        // 按语言过滤
        if (selectedLanguage) {
            result = result.filter(repo => repo.language === selectedLanguage);
        }

        // 排序
        return result.sort((a, b) => {
            switch (sortBy) {
                case 'stars':
                    return (b.stars || 0) - (a.stars || 0);
                case 'forks':
                    return (b.forks || 0) - (a.forks || 0);
                case 'recent_stars':
                    const growthA = calculateGrowthRate(a);
                    const growthB = calculateGrowthRate(b);
                    return growthB - growthA; // 按增长率降序
                default:
                    return (b.stars || 0) - (a.stars || 0);
            }
        });
    }, [repositories, selectedLanguage, sortBy]); // 依赖项

    // 步骤 3: 条件化搜索或切片
    const displayedRepos = useMemo(() => {
        const lowerFilter = filter.trim().toLowerCase(); // 获取搜索文本

        // 如果没有搜索文本，应用语言和排序，然后取前30
        if (!lowerFilter) {
            return filteredSortedFullRepos.slice(0, 30);
        }

        // 如果有搜索文本，在已过滤排序的完整列表上执行搜索
        const searchResults = filteredSortedFullRepos.filter(repo =>
            repo.name.toLowerCase().includes(lowerFilter) ||
            (repo.description && repo.description.toLowerCase().includes(lowerFilter))
        );

        // 返回所有搜索结果
        return searchResults;

    }, [filteredSortedFullRepos, filter]); // 依赖项

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <div className="loading-text">正在加载最受欢迎仓库数据...</div>
            </div>
        );
    }

    if (error && !isUsingMockData) {
        return <div className="error-container">错误: {error}</div>;
    }

    if (!repositories || repositories.length === 0) {
        return <div className="empty-data">没有找到仓库数据</div>;
    }

    return (
        <div className="top-repositories-page">
            <h1 className="page-title">最受欢迎仓库</h1>

            {isUsingMockData && (
                <div className="mock-data-notice">
                    注意：由于API不可用，当前显示的是模拟数据。
                </div>
            )}

            <div className="top-repos-filters">
                <div className="filter-group">
                    <label htmlFor="sort-select">排序方式:</label>
                    <select
                        id="sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="stars">按星标数</option>
                        <option value="forks">按分叉数</option>
                        <option value="recent_stars">按最近增长</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="language-select">编程语言:</label>
                    <select
                        id="language-select"
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                    >
                        <option value="">全部语言</option>
                        {availableLanguages.map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="search-input">搜索:</label>
                    <input
                        id="search-input"
                        type="text"
                        placeholder="搜索仓库名称或描述"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="repositories-grid">
                {displayedRepos.length === 0 && !loading && (
                    <div className="empty-data">没有匹配当前条件的仓库</div>
                )}
                {displayedRepos.map((repo, index) => (
                    <div
                        key={repo.repo_id || index}
                        className={`repository-card ${hoveredRepo === repo.repo_id ? 'hovered' : ''}`}
                        onMouseEnter={() => setHoveredRepo(repo.repo_id)}
                        onMouseLeave={() => setHoveredRepo(null)}
                    >
                        <div className="repository-rank">{index + 1}</div>
                        <div className="repository-header">
                            <h3 className="repository-name">
                                <a
                                    href={repo.description || `https://github.com/${repo.url}/${repo.name}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <span className="repository-owner">{repo.url}/</span>
                                    {repo.name}
                                </a>
                            </h3>
                        </div>
                        <div className="repository-description">{repo.owner}</div>

                        <div className="repository-meta">
                            {repo.language && (
                                <div className="repository-language">
                                    <span
                                        className="language-color"
                                        style={{ backgroundColor: getLanguageColor(repo.language) }}
                                    ></span>
                                    <span className="language-name">{repo.language}</span>
                                </div>
                            )}

                            <div className="repository-stats">
                                <div className="repository-stars">
                                    <svg className="icon" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
                                    </svg>
                                    <span title={`${(repo.stars || 0).toLocaleString()} 个星标`}>
                                        {formatNumber(repo.stars)}
                                    </span>
                                </div>

                                <div className="repository-forks">
                                    <svg className="icon" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                                    </svg>
                                    <span title={`${(repo.forks || 0).toLocaleString()} 个分叉`}>
                                        {formatNumber(repo.forks)}
                                    </span>
                                </div>

                                {(repo.stars_month_ago !== null && repo.stars_month_ago !== undefined) && (
                                    <div
                                        className={`repository-growth ${calculateGrowthRate(repo) >= 0 ? 'positive' : 'negative'}`}
                                        title={`过去一个月星标增长了 ${calculateGrowthRate(repo)}%`}
                                    >
                                        <svg className="icon" viewBox="0 0 16 16" fill="currentColor">
                                            <path fillRule="evenodd" d="M8 12a.75.75 0 01-.75-.75V5.66L3.668 9.123a.75.75 0 11-1.036-1.086l5.25-5a.75.75 0 011.071 0l5.25 5a.75.75 0 11-1.036 1.086L8.75 5.66v5.59A.75.75 0 018 12z" />
                                        </svg>
                                        <span>{calculateGrowthRate(repo)}%</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TopRepositories;