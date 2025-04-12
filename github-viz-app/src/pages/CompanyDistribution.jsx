import { useState, useEffect } from 'react';
import API from '../config/api';

const CompanyDistribution = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const response = await fetch(API.companyDistribution);
                if (!response.ok) throw new Error('获取数据失败');
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err.message);
                console.error('获取公司分布出错:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) return <div className="loading-indicator">数据加载中...</div>;
    if (error) return <div className="error-message">加载出错: {error}</div>;

    // 如果数据为空或不是期望的格式
    if (!data || !Array.isArray(data) || data.length === 0) {
        return <div className="empty-data">没有公司分布数据</div>;
    }

    // 处理数据并计算统计值
    const totalContributors = data.reduce((sum, item) => sum + (item.contributor_count || 0), 0);
    const companies = data.map(item => ({
        name: item.company,
        count: item.contributor_count || 0,
        percentage: ((item.contributor_count || 0) / totalContributors * 100).toFixed(1)
    }));

    // 基于公司名称简单分类领域 (实际项目中应该由API提供)
    const domainMapping = {
        'Google': '企业',
        'Microsoft': '企业',
        'Red Hat': '企业',
        'Facebook': '企业',
        'IBM': '企业',
        'Amazon': '企业',
        'Apple': '企业',
        'Oracle': '企业',
        'GitHub': '企业',
        'University': '学术',
        'MIT': '学术',
        'Stanford': '学术',
        'Foundation': '非营利组织',
        'Institute': '非营利组织'
    };

    // 生成领域数据
    const domainCounts = {
        '企业': 0,
        '学术': 0,
        '非营利组织': 0,
        '独立开发者': 0
    };

    companies.forEach(company => {
        let assigned = false;
        Object.entries(domainMapping).forEach(([keyword, domain]) => {
            if (company.name.includes(keyword)) {
                domainCounts[domain] += company.count;
                assigned = true;
            }
        });
        if (!assigned) {
            domainCounts['独立开发者'] += company.count;
        }
    });

    const domains = Object.entries(domainCounts).map(([name, count]) => ({
        name,
        count,
        percentage: (count / totalContributors * 100).toFixed(1)
    }));

    // 生成渐变色
    const getCompanyColor = (index, total) => {
        const hue = 210; // 蓝色调
        const saturation = '75%';
        const minLightness = 35;
        const maxLightness = 65;

        // 根据索引计算亮度值，使颜色由深到浅
        const lightness = maxLightness - ((index / Math.min(total - 1, 12)) * (maxLightness - minLightness));

        return `hsl(${hue}, ${saturation}, ${lightness}%)`;
    };

    // 对于领域图表使用不同颜色
    const getDomainColor = (index) => {
        const colors = ['#4299e1', '#48bb78', '#ed8936', '#f56565'];
        return colors[index % colors.length];
    };

    return (
        <div className="company-distribution-page">
            <h1 className="page-title">公司分布</h1>

            <div className="stats-overview">
                <div className="card stat-card">
                    <div className="stat-value">{totalContributors.toLocaleString()}</div>
                    <div className="stat-label">企业贡献者</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-value">{companies.length}</div>
                    <div className="stat-label">主要公司</div>
                </div>
                {companies.length > 0 && (
                    <div className="card stat-card">
                        <div className="stat-value">{companies[0].name}</div>
                        <div className="stat-label">贡献最多的公司</div>
                        <div className="stat-description">{companies[0].count.toLocaleString()} 名贡献者</div>
                    </div>
                )}
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">公司分布图</h2>
                </div>
                <div className="card-body">
                    <div className="company-chart">
                        <div className="chart-container">
                            {/* 在实际项目中使用Recharts等图表库实现饼图 */}
                            <div className="mock-pie-chart">
                                {companies.filter((_, index) => index < 8).map((company, index) => (
                                    <div
                                        key={company.name}
                                        className="pie-segment"
                                        style={{
                                            backgroundColor: getCompanyColor(index, companies.length),
                                            transform: `rotate(${index * 45}deg)`,
                                            zIndex: 10 - index
                                        }}
                                    >
                                        <span className="segment-label">
                                            {company.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="chart-legend">
                            {companies.slice(0, 10).map((company, index) => (
                                <div key={company.name} className="legend-item">
                                    <div
                                        className="color-indicator"
                                        style={{ backgroundColor: getCompanyColor(index, companies.length) }}
                                    ></div>
                                    <div className="company-info">
                                        <span className="company-name">{company.name}</span>
                                        <span className="company-percentage">{company.percentage}%</span>
                                    </div>
                                    <div className="company-count">{company.count.toLocaleString()} 名贡献者</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">贡献者领域分布</h2>
                </div>
                <div className="card-body">
                    <div className="horizontal-bars">
                        {domains.map((domain, index) => (
                            <div key={domain.name} className="horizontal-bar-item">
                                <div className="bar-label">{domain.name}</div>
                                <div className="bar-container">
                                    <div
                                        className="bar-fill"
                                        style={{
                                            width: `${domain.percentage}%`,
                                            backgroundColor: getDomainColor(index)
                                        }}
                                    ></div>
                                </div>
                                <div className="bar-value">{domain.count.toLocaleString()} ({domain.percentage}%)</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">公司贡献热图</h2>
                </div>
                <div className="card-body">
                    <div className="map-placeholder">
                        <div className="mock-map">
                            <div className="map-message">
                                在实际项目中，这里可以展示一个公司贡献热图，
                                显示世界各个地区公司贡献者的密度分布。
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyDistribution; 