import React, { useState, useEffect } from 'react';
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
        'C': '#555555',         // 示例：添加 C 语言
        'Shell': '#89e051',     // 示例：添加 Shell
        'HTML': '#e34c26',      // 示例：添加 HTML
        'CSS': '#563d7c',       // 示例：添加 CSS
    };

    // 如果预定义了颜色，直接返回
    if (colorMap[language]) {
        return colorMap[language];
    }

    // 备用颜色：基于语言名称生成 HSL 颜色，调整饱和度和亮度
    // 将饱和度从 70% 调整为 65%，亮度从 60% 调整为 65%
    const hue = Math.abs(language.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 360;
    return `hsl(${hue}, 65%, 65%)`;
};

const LanguageDistribution = () => {
    const [data, setData] = useState([]);
    const [topRepos, setTopRepos] = useState({});
    const [hoveredLanguage, setHoveredLanguage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await fetch(API.languageDistribution);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const result = await response.json();
                setData(result);

                // 为每种语言获取前6个星标最高的仓库
                const languageTopRepos = {};
                for (const lang of result.slice(0, 15)) {/* 遍历前10种语言 */
                    const reposResponse = await fetch(`${API.languageTopRepos}?language=${encodeURIComponent(lang.language)}`);
                    if (reposResponse.ok) {
                        const reposData = await reposResponse.json();
                        languageTopRepos[lang.language] = reposData;
                    }
                }
                setTopRepos(languageTopRepos);
            } catch (err) {
                setError(`获取数据失败: ${err.message}`);
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // 显示加载状态
    if (loading) {
        return <div className="loading-container">
            <div className="spinner"></div>
            <div className="loading-text">正在加载语言分布数据...</div>
        </div>;
    }

    // 显示错误
    if (error) {
        return <div className="error-container">错误: {error}</div>;
    }

    // 确保数据存在且非空
    if (!data || data.length === 0) {
        return <div className="empty-data">没有找到语言分布数据</div>;
    }

    // 计算总数和最大值，用于百分比计算
    const totalCount = data.reduce((sum, item) => sum + item.count, 0);
    const maxCount = Math.max(...data.map(item => item.count));

    return (
        <div className="language-distribution-container">
            <h2>编程语言分布</h2>
            <div className="horizontal-bars-container">
                {data.map((item, index) => {
                    const percentage = (item.count / totalCount * 100).toFixed(1);//计算百分比
                    const barWidth = (item.count / maxCount * 100).toFixed(1) + '%';//计算宽度
                    //const barWidth = (item.count / totalCount * 100).toFixed(1) + '%';

                    return (
                        <div
                            key={index}
                            className={`language-bar-item ${hoveredLanguage === item.language ? 'hovered' : ''}`}//hoveredLanguage 是悬停的语言
                            onMouseEnter={() => setHoveredLanguage(item.language)}//setHoveredLanguage 是设置悬停的语言
                            onMouseLeave={() => setHoveredLanguage(null)}//setHoveredLanguage 是设置悬停的语言
                        >
                            <div className="language-name">{item.language}</div>
                            <div className="bar-container">
                                <div
                                    style={{//style 是css样式
                                        width: barWidth,//barWidth 是百分比
                                        backgroundColor: getLanguageColor(item.language),//根据语言名称生成颜色
                                        //backgroundColor: 'red',
                                        //height: '100%',
                                        height: '20px',
                                        borderRadius: '4px',//borderRadius 是圆角
                                        display: 'block',//display 是显示方式
                                        opacity: 0.8//opacity 是透明度
                                    }}
                                />
                            </div>
                            <div className="language-count">
                                {item.count.toLocaleString()} ({percentage}%)
                            </div>

                            {/* 悬停时显示该语言的热门仓库 */}
                            {hoveredLanguage === item.language && topRepos[item.language] && (
                                <div className="language-top-repos">
                                    <h4>{item.language} 热门仓库</h4>
                                    <ul>
                                        {topRepos[item.language].map((repo, i) => ( /* 遍历热门仓库 */
                                            <li key={i}>{/* 每个热门仓库的唯一标识 */}
                                                <div className="repo-name">{repo.repo_name}</div>
                                                <div className="repo-stats">
                                                    <span>⭐ {repo.stars.toLocaleString()}</span>
                                                    <span>🔱 {repo.forks.toLocaleString()}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LanguageDistribution; 