import { useState, useEffect } from 'react';
import API from '../config/api';

const StarsIssuesRelation = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoveredRepo, setHoveredRepo] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const response = await fetch(API.starsIssues);
                if (!response.ok) throw new Error('获取数据失败');
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err.message);
                console.error('获取星标与问题关系出错:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) return <div className="loading-indicator">数据加载中...</div>;
    if (error) return <div className="error-message">加载出错: {error}</div>;
    if (!data || !Array.isArray(data) || data.length === 0) {
        return <div className="empty-data">没有星标与问题关系数据</div>;
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

        return colorMap[language] || '#cccccc';
    };

    // 计算一些数据统计信息
    const totalRepositories = data.length;
    const totalStars = data.reduce((sum, repo) => sum + (repo.stars || 0), 0);
    const totalIssues = data.reduce((sum, repo) => sum + (repo.open_issues || 0), 0);
    const averageIssuesPerRepo = totalRepositories > 0
        ? Math.round(totalIssues / totalRepositories)
        : 0;
    const averageStarsPerIssue = totalIssues > 0
        ? Math.round(totalStars / totalIssues)
        : 0;

    // 分析星标/问题比率的不同范围
    const ratioGroups = [
        { name: '低星标高问题比', min: 0, max: 10, count: 0 },
        { name: '中等比率', min: 10, max: 50, count: 0 },
        { name: '高星标低问题比', min: 50, max: Infinity, count: 0 }
    ];

    data.forEach(repo => {
        const ratio = (repo.stars || 0) / Math.max(1, (repo.open_issues || 0));
        ratioGroups.forEach(group => {
            if (ratio >= group.min && ratio < group.max) {
                group.count++;
            }
        });
    });

    return (
        <div className="stars-issues-page">
            <h1 className="page-title">星标与问题关系</h1>

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
                    <div className="stat-value">{totalIssues.toLocaleString()}</div>
                    <div className="stat-label">问题总数</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-value">{averageStarsPerIssue.toLocaleString()}</div>
                    <div className="stat-label">平均星标/问题</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">星标与问题的散点图</h2>
                </div>
                <div className="card-body">
                    <div className="scatter-plot-container">
                        <div className="scatter-plot">
                            {data.map((repo, index) => {
                                const stars = repo.stars || 0;
                                const issues = repo.open_issues || 0;
                                const xPos = Math.min((stars / 100000) * 100, 95);
                                const yPos = Math.min((issues / 5000) * 100, 95);

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
                                        title={`${repo.repo_name}: ${stars.toLocaleString()} stars, ${issues.toLocaleString()} issues`}
                                    >
                                        {hoveredRepo === index && (
                                            <div className="point-tooltip">
                                                <div className="tooltip-title">{repo.repo_name}</div>
                                                <div className="tooltip-stats">
                                                    <div>⭐ {stars.toLocaleString()}</div>
                                                    <div>🔴 {issues.toLocaleString()}</div>
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
                                    <span>10k</span>
                                    <span>20k</span>
                                    <span>30k</span>
                                    <span>40k</span>
                                    <span>50k+</span>
                                </div>
                            </div>

                            <div className="scatter-plot-axis y-axis">
                                <div className="axis-label">问题数</div>
                                <div className="axis-ticks">
                                    <span>5k+</span>
                                    <span>4k</span>
                                    <span>3k</span>
                                    <span>2k</span>
                                    <span>1k</span>
                                    <span>0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">星标与问题比率分析</h2>
                </div>
                <div className="card-body">
                    <div className="ratio-analysis">
                        <div className="ratio-chart">
                            {ratioGroups.map((group, index) => (
                                <div key={index} className="ratio-bar">
                                    <div className="ratio-label">{group.name}</div>
                                    <div className="ratio-bar-container">
                                        <div
                                            className="ratio-bar-fill"
                                            style={{
                                                width: `${(group.count / totalRepositories) * 100}%`,
                                                backgroundColor: ['#f56565', '#4299e1', '#48bb78'][index]
                                            }}
                                        ></div>
                                    </div>
                                    <div className="ratio-count">
                                        {group.count} 个项目
                                        ({((group.count / totalRepositories) * 100).toFixed(1)}%)
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="ratio-insights">
                            <p>
                                星标与问题的比率可以反映项目的受欢迎程度与维护难度。
                                比率高的项目通常有更多用户但较少的问题，可能表明代码质量更高或维护更活跃。
                            </p>
                            <p>
                                平均每个问题有 <strong>{averageStarsPerIssue.toLocaleString()}</strong> 个星标，
                                平均每个项目有 <strong>{averageIssuesPerRepo.toLocaleString()}</strong> 个问题。
                            </p>
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
                                    <th>问题数</th>
                                    <th>星标/问题比率</th>
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
                                        <td>{(repo.open_issues || 0).toLocaleString()}</td>
                                        <td>{Math.round((repo.stars || 0) / Math.max(1, (repo.open_issues || 1))).toLocaleString()}</td>
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

export default StarsIssuesRelation; 