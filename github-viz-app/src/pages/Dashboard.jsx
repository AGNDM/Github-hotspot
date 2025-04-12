import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
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
        PHP: '#4F5D95',
        Rust: '#dea584',
        'C#': '#178600',
        Swift: '#ffac45',
        Kotlin: '#F18E33',
        'C': '#555555',
        'Shell': '#89e051',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
    };
    if (colorMap[language]) {
        return colorMap[language];
    }
    const hue = Math.abs(language.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 360;
    return `hsl(${hue}, 65%, 65%)`;
};

// 新增：动画列表项组件
const AnimatedLanguageItem = ({ language, count, percentage, barWidth, color, index, onMouseEnter, onMouseLeave, onClick, isSelected, hoveredLanguage, topRepos }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { amount: 0.5, triggerOnce: false });

    return (
        <motion.div
            ref={ref}
            data-index={index}
            onMouseEnter={() => onMouseEnter()}
            onMouseLeave={() => onMouseLeave()}
            onClick={onClick}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
            transition={{ duration: 0.1, delay: index * 0.01 }}
            className={`language-bar-item ${isSelected ? 'selected' : ''}`}
            style={{ position: 'relative' }}
            hoveredLanguage={hoveredLanguage}
            topRepos={topRepos}
        >
            <div className="language-name">{language}</div>
            <div className="bar-container">
                <div
                    className="bar-fill"
                    style={{
                        width: barWidth,
                        height: '20px',
                        display: 'block',
                        opacity: 0.8,
                        backgroundColor: color,
                    }}
                />
            </div>
            <div className="language-count">
                {count.toLocaleString()} ({percentage}%)
            </div>
        </motion.div>
    );
};

// Helper function to format numbers (can be reused or imported)
const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString(); // Use toLocaleString for full numbers
};

// Helper function to calculate growth rate (matching TopRepositories.jsx)
const calculateGrowthRate = (repo) => {
    if (repo.stars_month_ago === null || repo.stars_month_ago === undefined || repo.stars_month_ago === 0) return 0;
    const growth = (repo.stars || 0) - repo.stars_month_ago;
    const baseStars = repo.stars_month_ago || 1;
    const rate = (growth / baseStars) * 100;
    // Handle potential Infinity or NaN if needed, though baseStars || 1 helps
    return isFinite(rate) ? rate.toFixed(1) : 'N/A';
};

// NEW: Generic Animated List Item Wrapper
const AnimatedListItem = ({ index, children }) => {
    const ref = useRef(null);
    // Adjust amount if needed, 0.2 means 20% visible triggers animation
    const inView = useInView(ref, { amount: 0.2, triggerOnce: false });

    return (
        <motion.div
            ref={ref}
            initial={{ scale: 0.8, opacity: 0 }} // Start slightly larger scale for cards? Or keep 0.7
            animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15, delay: index * 0.02 }} // Slightly adjusted delay/duration for card list
        >
            {children}
        </motion.div>
    );
};

const Dashboard = () => {
    // Initialize stats with 0 or null
    const [stats, setStats] = useState({ totalRepositories: 0, totalStars: 0, totalContributors: 0 });
    const [languageData, setLanguageData] = useState([]);
    const [topReposByLang, setTopReposByLang] = useState({}); // Renamed for clarity
    const [dashboardTopRepos, setDashboardTopRepos] = useState([]); // State for top growing repos
    const [hoveredLanguage, setHoveredLanguage] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true); // Keep loading state for stats
    const [loadingLanguages, setLoadingLanguages] = useState(true);
    const [loadingTopRepos, setLoadingTopRepos] = useState(true); // Loading state for top repos section
    const [error, setError] = useState(null); // Use a single error state or separate if needed
    const [selectedLanguageIndex, setSelectedLanguageIndex] = useState(-1);

    useEffect(() => {
        // Fetch data for Stats Overview
        const fetchStatsData = async () => {
            setLoadingStats(true);
            try {
                const statsResponse = await fetch(API.starsContributors); // Fetch data used for stats
                if (!statsResponse.ok) {
                    throw new Error(`获取统计数据失败: ${statsResponse.status}`);
                }
                const statsResult = await statsResponse.json();

                // Calculate stats from the fetched data
                const totalRepositories = statsResult.length; // Use length as repo count for dashboard
                const totalStars = statsResult.reduce((sum, repo) => sum + (repo.stars || 0), 0);
                const totalContributors = statsResult.reduce((sum, repo) => sum + (repo.contributors_count || 0), 0);

                setStats({ totalRepositories, totalStars, totalContributors });

            } catch (err) {
                console.error("获取仪表盘统计数据失败:", err);
                setError(prev => prev ? `${prev}\n统计数据加载失败` : '统计数据加载失败'); // Append or set error
                // Optionally set stats to fallback values or keep them 0
                setStats({ totalRepositories: 0, totalStars: 0, totalContributors: 0 });
            } finally {
                setLoadingStats(false);
            }
        };

        // Fetch data for Language Distribution and Top Repos per Language
        const fetchLanguageData = async () => {
            setLoadingLanguages(true);
            try {
                const langResponse = await fetch(API.languageDistribution);
                if (!langResponse.ok) {
                    throw new Error(`获取语言数据失败: ${langResponse.status}`);
                }
                const langResult = await langResponse.json();
                setLanguageData(langResult);

                // Fetch top repos for top languages (keep this logic)
                const languageTopRepos = {};
                const topLanguages = langResult.slice(0, 15); // Fetch for top 15 displayed languages
                // Use Promise.all for potentially faster fetching if backend/network allows
                await Promise.all(topLanguages.map(async (lang) => {
                    try {
                        const reposResponse = await fetch(`${API.languageTopRepos}?language=${encodeURIComponent(lang.language)}`);
                        if (reposResponse.ok) {
                            const reposData = await reposResponse.json();
                            languageTopRepos[lang.language] = reposData;
                        } else {
                            console.warn(`获取 ${lang.language} 热门仓库失败: ${reposResponse.status}`);
                        }
                    } catch (repoError) {
                        console.warn(`获取 ${lang.language} 热门仓库失败:`, repoError);
                    }
                }));
                setTopReposByLang(languageTopRepos);

            } catch (err) {
                console.error("获取仪表盘语言数据失败:", err);
                setError(prev => prev ? `${prev}\n语言数据加载失败` : '语言数据加载失败'); // Append or set error
                setLanguageData([]); // Set to empty on error
                setTopReposByLang({});
            } finally {
                setLoadingLanguages(false);
            }
        };

        // Fetch data for Top Growing Repositories
        const fetchTopGrowingRepos = async () => {
            setLoadingTopRepos(true);
            try {
                const response = await fetch(API.topRepositories); // Fetch all top repos
                if (!response.ok) {
                    throw new Error(`获取Top仓库数据失败: ${response.status}`);
                }
                let repos = await response.json();

                // Calculate growth rate for each and sort
                repos.forEach(repo => {
                    repo.growthRate = parseFloat(calculateGrowthRate(repo)) || 0; // Add growthRate property
                });

                repos.sort((a, b) => b.growthRate - a.growthRate); // Sort by growth rate descending

                setDashboardTopRepos(repos.slice(0, 10)); // Get top 10

            } catch (err) {
                console.error("获取仪表盘热门增长仓库失败:", err);
                setError(prev => prev ? `${prev}\n热门增长仓库加载失败` : '热门增长仓库加载失败');
                setDashboardTopRepos([]); // Set empty on error
            } finally {
                setLoadingTopRepos(false);
            }
        };

        // Call all fetch functions
        fetchStatsData();
        fetchLanguageData();
        fetchTopGrowingRepos(); // Fetch top growing repos

    }, []); // Empty dependency array ensures this runs once on mount

    const totalCount = languageData.reduce((sum, item) => sum + item.count, 0);
    const maxCount = Math.max(...languageData.map(item => item.count));

    return (
        <div className="dashboard">
            <h1 className="page-title">数据概览</h1>

            {/* Stats Overview - uses stats state which is now dynamic */}
            <div className="stats-overview">
                <div className="card stat-card">
                    <div className="stat-value">{loadingStats ? '...' : stats.totalRepositories.toLocaleString()}</div>
                    <div className="stat-label">仓库总数</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-value">{loadingStats ? '...' : stats.totalStars.toLocaleString()}</div>
                    <div className="stat-label">总星标数</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-value">{loadingStats ? '...' : stats.totalContributors.toLocaleString()}</div>
                    <div className="stat-label">贡献者总数</div>
                </div>
            </div>

            {/* Display combined error message if any */}
            {error && <div className="error-message">错误: {error}</div>}

            {/* Language Distribution Card - uses languageData state */}
            <div className="dashboard-row">
                <div className="card language-distribution-card">
                    <div className="card-header">
                        <h2 className="card-title">编程语言分布</h2>
                    </div>
                    <div className="card-body">
                        {/* Loading/Empty/Data display logic for languages remains the same */}
                        {loadingLanguages ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <div className="loading-text">正在加载语言数据...</div>
                            </div>
                        ) : !languageData || languageData.length === 0 ? (
                            <div className="empty-data">没有找到语言分布数据</div>
                        ) : (
                            <div className="scroll-list-container" style={{ maxHeight: '450px' }}>
                                <div className="scroll-list">
                                    {languageData.slice(0, 15).map((item, index) => {
                                        const percentage = totalCount > 0 ? (item.count / totalCount * 100).toFixed(1) : 0;
                                        const barWidth = maxCount > 0 ? (item.count / maxCount * 100).toFixed(1) + '%' : '0%';
                                        return (
                                            <AnimatedLanguageItem
                                                key={index}
                                                index={index}
                                                language={item.language}
                                                count={item.count}
                                                percentage={percentage}
                                                barWidth={barWidth}
                                                color={getLanguageColor(item.language)}
                                                isSelected={selectedLanguageIndex === index}
                                                hoveredLanguage={hoveredLanguage}
                                                topRepos={topReposByLang}
                                                onMouseEnter={() => { setHoveredLanguage(item.language); setSelectedLanguageIndex(index); }}
                                                onMouseLeave={() => setHoveredLanguage(null)}
                                                onClick={() => { setHoveredLanguage(item.language); setSelectedLanguageIndex(index); }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Repositories Card - Now uses AnimatedListItem */}
                <div className="card top-repositories-card">
                    <div className="card-header">
                        <h2 className="card-title">热门仓库 (Top 10)</h2>
                    </div>
                    <div className="card-body">
                        {loadingTopRepos ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <div className="loading-text">正在加载热门仓库...</div>
                            </div>
                        ) : !dashboardTopRepos || dashboardTopRepos.length === 0 ? (
                            <div className="empty-data">无法加载热门仓库数据</div>
                        ) : (
                            <div className="scroll-list-container" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                                <div className="repo-list-dynamic">
                                    {dashboardTopRepos.map((repo, index) => (
                                        // Wrap the existing card structure with AnimatedListItem
                                        <AnimatedListItem key={repo.repo_id || index} index={index}>
                                            <div
                                                className="repository-card dashboard-repo-card"
                                            // Remove hover effects from here if animation handles it,
                                            // or keep if you want both hover and scroll animation.
                                            >
                                                <div className="repository-rank">{index + 1}</div>
                                                <div className="repository-header">
                                                    <h3 className="repository-name">
                                                        <a href={repo.description || '#'} target="_blank" rel="noopener noreferrer">
                                                            <span className="repository-owner">{repo.url}/</span>{repo.name}
                                                        </a>
                                                    </h3>
                                                </div>
                                                <div className="repository-description">{repo.owner}</div>
                                                <div className="repository-meta">
                                                    {repo.language && (
                                                        <div className="repository-language">
                                                            <span className="language-color" style={{ backgroundColor: getLanguageColor(repo.language) }}></span>
                                                            <span className="language-name">{repo.language}</span>
                                                        </div>
                                                    )}
                                                    <div className="repository-stats">
                                                        <div className="repository-stars">
                                                            <svg className="icon" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" /></svg>
                                                            <span title={`${(repo.stars || 0).toLocaleString()} 个星标`}>{formatNumber(repo.stars)}</span>
                                                        </div>
                                                        <div className="repository-forks">
                                                            <svg className="icon" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z" /></svg>
                                                            <span title={`${(repo.forks || 0).toLocaleString()} 个分叉`}>{formatNumber(repo.forks)}</span>
                                                        </div>
                                                        {(repo.stars_month_ago !== null && repo.stars_month_ago !== undefined) && (
                                                            <div
                                                                className={`repository-growth ${repo.growthRate >= 0 ? 'positive' : 'negative'}`}
                                                                title={`过去一个月星标增长 ${repo.growthRate}%`}
                                                            >
                                                                <svg className="icon" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M8 12a.75.75 0 01-.75-.75V5.66L3.668 9.123a.75.75 0 11-1.036-1.086l5.25-5a.75.75 0 011.071 0l5.25 5a.75.75 0 11-1.036 1.086L8.75 5.66v5.59A.75.75 0 018 12z" /></svg>
                                                                <span>{repo.growthRate}%</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </AnimatedListItem>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 