import { useState, useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import { useGitHubData } from '../../contexts/GitHubDataContext';
import { useTheme } from '../../contexts/ThemeContext';
import ChartCard from '../ui/ChartCard';
import { ExternalLinkIcon } from '@heroicons/react/outline';

const TopRepositoriesChart = () => {
    const { repositories } = useGitHubData();
    const { theme } = useTheme();
    const [sortBy, setSortBy] = useState('stars');
    const [count, setCount] = useState(10);
    const [showDetails, setShowDetails] = useState(false);

    // 排序选项
    const sortOptions = [
        { value: 'stars', label: '星标数' },
        { value: 'forks', label: '分叉数' },
        { value: 'contributors', label: '贡献者数' },
        { value: 'issues', label: '问题数' },
        { value: 'recent_stars', label: '最近增长' }
    ];

    // 根据选择的排序方式，处理图表数据
    const chartData = useMemo(() => {
        if (!repositories.length) return [];

        let sortedRepos = [...repositories];

        switch (sortBy) {
            case 'stars':
                sortedRepos.sort((a, b) => b.stars_count - a.stars_count);
                break;
            case 'forks':
                sortedRepos.sort((a, b) => b.forks_count - a.forks_count);
                break;
            case 'contributors':
                sortedRepos.sort((a, b) => (b.contributors_count || 0) - (a.contributors_count || 0));
                break;
            case 'issues':
                sortedRepos.sort((a, b) => (b.open_issues_count || 0) - (a.open_issues_count || 0));
                break;
            case 'recent_stars':
                sortedRepos.sort((a, b) => {
                    const aGrowth = a.stars_count - (a.stars_one_month_ago || 0);
                    const bGrowth = b.stars_count - (b.stars_one_month_ago || 0);
                    return bGrowth - aGrowth;
                });
                break;
            default:
                sortedRepos.sort((a, b) => b.stars_count - a.stars_count);
        }

        return sortedRepos.slice(0, count).map(repo => {
            // 计算星标增长
            const starGrowth = repo.stars_count - (repo.stars_one_month_ago || 0);
            const growthPercentage = repo.stars_one_month_ago
                ? (starGrowth / repo.stars_one_month_ago * 100).toFixed(1)
                : '100';

            return {
                name: repo.name,
                stars: repo.stars_count,
                forks: repo.forks_count,
                contributors: repo.contributors_count || 0,
                issues: repo.open_issues_count || 0,
                language: repo.language || 'Unknown',
                starGrowth,
                growthPercentage,
                url: repo.url,
                description: repo.description || '',
                owner: repo.owner || '',
                fullname: repo.fullname || repo.name
            };
        });
    }, [repositories, sortBy, count]);

    // 获取语言颜色
    const getLanguageColor = (language) => {
        if (!language) return '#999';

        const colorMap = {
            JavaScript: '#f1e05a',
            TypeScript: '#2b7489',
            Python: '#3572A5',
            Java: '#b07219',
            Go: '#00ADD8',
            Rust: '#dea584',
            C: '#555555',
            'C++': '#f34b7d',
            'C#': '#178600',
            Ruby: '#701516',
            PHP: '#4F5D95',
            Swift: '#ffac45',
            Kotlin: '#F18E33',
            Dart: '#00B4AB',
            Unknown: '#999999'
        };

        return colorMap[language] || `hsl(${Math.abs(language.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 360}, 70%, 60%)`;
    };

    // 格式化数字
    const formatNumber = (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    // 自定义工具提示
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="custom-tooltip" style={{
                    backgroundColor: theme === 'dark' ? '#333' : '#fff',
                    color: theme === 'dark' ? '#fff' : '#333',
                    border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                    padding: '10px',
                    borderRadius: '4px',
                    maxWidth: '300px'
                }}>
                    <p className="tooltip-name">{data.name}</p>
                    <p className="tooltip-language">
                        <span style={{
                            display: 'inline-block',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: getLanguageColor(data.language),
                            marginRight: '5px'
                        }}></span>
                        {data.language}
                    </p>
                    {data.description && (
                        <p className="tooltip-description" style={{
                            marginTop: '8px',
                            fontSize: '12px',
                            opacity: 0.8,
                            lineHeight: 1.4
                        }}>
                            {data.description}
                        </p>
                    )}
                    <div className="tooltip-stats" style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '5px',
                        marginTop: '8px'
                    }}>
                        <div>⭐ 星标: {formatNumber(data.stars)}</div>
                        <div>🍴 分叉: {formatNumber(data.forks)}</div>
                        <div>👥 贡献者: {formatNumber(data.contributors)}</div>
                        <div>📝 问题: {formatNumber(data.issues)}</div>
                    </div>
                    {sortBy === 'recent_stars' && (
                        <p className="tooltip-growth" style={{ marginTop: '8px' }}>
                            本月增长: +{formatNumber(data.starGrowth)} ({data.growthPercentage}%)
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    // 获取当前排序项的展示字段名
    const getSortFieldData = (data) => {
        switch (sortBy) {
            case 'stars': return data.stars;
            case 'forks': return data.forks;
            case 'contributors': return data.contributors;
            case 'issues': return data.issues;
            case 'recent_stars': return data.starGrowth;
            default: return data.stars;
        }
    };

    // 处理切换详细信息视图
    const toggleDetails = () => {
        setShowDetails(!showDetails);
    };

    return (
        <ChartCard
            title="最受欢迎仓库排行"
            description="展示GitHub上最受欢迎的仓库排名，可根据不同指标进行排序。"
            className="top-repositories-chart"
        >
            <div className="chart-filters">
                <div className="filter-group">
                    <label htmlFor="sort-select">排序方式:</label>
                    <select
                        id="sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        {sortOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="count-select">显示数量:</label>
                    <select
                        id="count-select"
                        value={count}
                        onChange={(e) => setCount(parseInt(e.target.value, 10))}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>

                <button
                    className={`view-toggle-btn ${showDetails ? 'active' : ''}`}
                    onClick={toggleDetails}
                >
                    {showDetails ? '图表视图' : '详细视图'}
                </button>
            </div>

            {!showDetails ? (
                // 图表视图
                <div className="chart-container" style={{ height: 500 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 120, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#555' : '#ddd'} />
                            <XAxis
                                type="number"
                                stroke={theme === 'dark' ? '#ccc' : '#666'}
                                tick={{ fill: theme === 'dark' ? '#ccc' : '#666' }}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                stroke={theme === 'dark' ? '#ccc' : '#666'}
                                tick={{ fill: theme === 'dark' ? '#ccc' : '#666' }}
                                width={100}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar
                                dataKey={(data) => getSortFieldData(data)}
                                name={sortOptions.find(opt => opt.value === sortBy)?.label}
                                fill={theme === 'dark' ? '#61dafb' : '#3182ce'}
                                radius={[0, 4, 4, 0]}
                                onClick={(data) => window.open(data.url, '_blank')}
                                cursor="pointer"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                // 详细列表视图
                <div className="repos-list-container">
                    <div className="repos-list-header">
                        <div className="repo-name-col">仓库名称</div>
                        <div className="repo-stats-col">
                            {sortOptions.find(opt => opt.value === sortBy)?.label}
                        </div>
                        <div className="repo-link-col">链接</div>
                    </div>

                    <motion.div
                        className="repos-list"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {chartData.map((repo, index) => (
                            <motion.div
                                key={repo.name}
                                className="repo-list-item"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <div className="repo-name-col">
                                    <div className="repo-name-with-lang">
                                        <span
                                            className="language-dot"
                                            style={{ backgroundColor: getLanguageColor(repo.language) }}
                                        ></span>
                                        <div className="repo-name-wrap">
                                            <div className="repo-name">{repo.name}</div>
                                            {repo.owner && <div className="repo-owner">{repo.owner}</div>}
                                        </div>
                                    </div>
                                    {repo.description && (
                                        <div className="repo-description">{repo.description}</div>
                                    )}
                                </div>

                                <div className="repo-stats-col">
                                    {sortBy === 'stars' && (
                                        <div className="repo-stat">⭐ {formatNumber(repo.stars)}</div>
                                    )}
                                    {sortBy === 'forks' && (
                                        <div className="repo-stat">🍴 {formatNumber(repo.forks)}</div>
                                    )}
                                    {sortBy === 'contributors' && (
                                        <div className="repo-stat">👥 {formatNumber(repo.contributors)}</div>
                                    )}
                                    {sortBy === 'issues' && (
                                        <div className="repo-stat">📝 {formatNumber(repo.issues)}</div>
                                    )}
                                    {sortBy === 'recent_stars' && (
                                        <div className="repo-growth">
                                            +{formatNumber(repo.starGrowth)}
                                            <span className="growth-percent">({repo.growthPercentage}%)</span>
                                        </div>
                                    )}
                                </div>

                                <div className="repo-link-col">
                                    <a
                                        href={repo.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="repo-link-btn"
                                    >
                                        <ExternalLinkIcon className="icon" />
                                        <span>查看</span>
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            )}
        </ChartCard>
    );
};

export default TopRepositoriesChart; 