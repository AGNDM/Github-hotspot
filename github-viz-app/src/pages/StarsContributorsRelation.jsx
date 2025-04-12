import { useState, useEffect } from 'react';
import API from '../config/api';

const StarsContributorsRelation = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoveredRepo, setHoveredRepo] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const response = await fetch(API.starsContributors);
                if (!response.ok) throw new Error('获取数据失败');
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err.message);
                console.error('获取星标与贡献者关系出错:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) return <div className="loading-indicator">数据加载中...</div>;
    if (error) return <div className="error-message">加载出错: {error}</div>;
    if (!data || !Array.isArray(data) || data.length === 0) {
        return <div className="empty-data">没有星标与贡献者关系数据</div>;
    }

    // 语言颜色映射
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
            Kotlin: '#F18E33'
        };

        return colorMap[language] || '#ccc';
    };

    // 计算一些数据统计信息
    const totalRepositories = data.length;
    const totalStars = data.reduce((sum, repo) => sum + (repo.stars || 0), 0);
    const totalContributors = data.reduce((sum, repo) => sum + (repo.contributors_count || 0), 0);
    const averageStarsPerContributor = totalContributors > 0
        ? Math.round(totalStars / totalContributors)
        : 0;

    return (
        <div className="stars-contributors-page">
            <h1 className="page-title">星标与贡献者关系</h1>

            <div className="stats-overview">
                <div className="card stat-card">
                    <div className="stat-value">{totalRepositories.toLocaleString()}</div>
                    <div className="stat-label">热门项目</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-value">{totalStars.toLocaleString()}</div>
                    <div className="stat-label">星标总数</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-value">{totalContributors.toLocaleString()}</div>
                    <div className="stat-label">贡献者总数</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-value">{averageStarsPerContributor.toLocaleString()}</div>
                    <div className="stat-label">平均星标/贡献者</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">星标与贡献者的散点图</h2>
                </div>
                <div className="card-body">
                    <div className="scatter-plot-container">
                        <div className="scatter-plot">
                            {data.map((repo, index) => {
                                const stars = repo.stars || 0;
                                const contributors = repo.contributors_count || 0;
                                const xPos = Math.min((stars / 100000) * 100, 95);// 星标数
                                const yPos = Math.min((contributors / 500) * 100, 95);// 贡献者数

                                return (
                                    <div
                                        key={index}
                                        className="scatter-point"
                                        style={{
                                            left: `${xPos}%`,
                                            bottom: `${yPos}%`,
                                            backgroundColor: getLanguageColor(repo.language),
                                            transform: hoveredRepo === index ? 'scale(1)' : 'scale(0.25)'
                                        }}
                                        onMouseEnter={() => setHoveredRepo(index)}
                                        onMouseLeave={() => setHoveredRepo(null)}
                                        title={`${repo.repo_name}: ${(stars).toLocaleString()} stars, ${(contributors).toLocaleString()} contributors`}
                                    >
                                        {hoveredRepo === index && (
                                            <div className="point-tooltip">
                                                <div className="tooltip-title">{repo.repo_name}</div>
                                                <div className="tooltip-stats">
                                                    <div>⭐ {stars.toLocaleString()}</div>
                                                    <div>👥 {contributors.toLocaleString()}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            <div className="scatter-plot-axis x-axis">
                                <div className="axis-label">星标数</div>
                                <div className="axis-ticks">
                                    <span>0</span>
                                    <span>80k</span>
                                    <span>160k</span>
                                    <span>240k</span>
                                    <span>320k</span>
                                    <span>400k+</span>
                                </div>
                            </div>
                            <div className="scatter-plot-axis y-axis">
                                <div className="axis-label">贡献者数</div>
                                <div className="axis-ticks">
                                    <span>500+</span>
                                    <span>400</span>
                                    <span>300</span>
                                    <span>200</span>
                                    <span>100</span>
                                    <span>0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">项目详情</h2>
                </div>
                <div className="card-body">
                    <div className="table-container">
                        <table className="project-details-table">
                            <thead>
                                <tr>
                                    <th>项目名称</th>
                                    <th>语言</th>
                                    <th>星标数</th>
                                    <th>贡献者数</th>
                                    <th>星标/贡献者比例</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.slice(0, 10).map((repo, index) => (
                                    <tr key={index}>
                                        <td>{repo.repo_name}</td>
                                        <td>
                                            <span
                                                className="language-indicator"
                                                style={{ backgroundColor: getLanguageColor(repo.language) }}
                                            ></span>
                                            {repo.language || '未知'}
                                        </td>
                                        <td>{(repo.stars || 0).toLocaleString()}</td>
                                        <td>{(repo.contributors_count || 0).toLocaleString()}</td>
                                        <td>{Math.round((repo.stars || 0) / Math.max(1, (repo.contributors_count || 1))).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StarsContributorsRelation; 