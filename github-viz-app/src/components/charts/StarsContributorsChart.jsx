import { useState, useMemo } from 'react';
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Label
} from 'recharts';
import { useGitHubData } from '../../contexts/GitHubDataContext';
import { useTheme } from '../../contexts/ThemeContext';
import ChartCard from '../ui/ChartCard';

const StarsContributorsChart = () => {
    const { repositories } = useGitHubData();
    const { theme } = useTheme();
    const [selectedLanguage, setSelectedLanguage] = useState('All');
    const [minStars, setMinStars] = useState(0);

    // 获取可用的语言列表
    const languages = useMemo(() => {
        if (repositories.length) {
            const langs = repositories
                .map(repo => repo.language)
                .filter(Boolean)
                .filter((lang, index, self) => self.indexOf(lang) === index)
                .sort();

            return ['All', ...langs];
        }
        return ['All'];
    }, [repositories]);

    // 根据筛选条件处理图表数据
    const chartData = useMemo(() => {
        if (!repositories.length) return [];

        return repositories
            .filter(repo => repo.stars_count >= minStars)
            .filter(repo => selectedLanguage === 'All' || repo.language === selectedLanguage)
            .map(repo => ({
                name: repo.name,
                contributors: repo.contributors_count || 0,
                stars: repo.stars_count,
                language: repo.language || 'Unknown',
                size: Math.log(repo.size || 1) * 2, // 使用仓库大小作为气泡大小
                url: repo.url
            }));
    }, [repositories, selectedLanguage, minStars]);

    // 根据语言生成颜色
    const getLanguageColor = (language) => {
        if (!language) return '#999';

        // 为常见语言定义固定颜色
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

    // 处理仓库点击
    const handleClickRepo = (data) => {
        if (data && data.url) {
            window.open(data.url, '_blank');
        }
    };

    // 自定义工具提示
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="custom-tooltip" style={{
                    backgroundColor: theme === 'dark' ? '#333' : '#fff',
                    color: theme === 'dark' ? '#fff' : '#333',
                    border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`,
                    padding: '10px',
                    borderRadius: '4px'
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
                        {data.language || 'Unknown'}
                    </p>
                    <p className="tooltip-stars">⭐ Stars: {data.stars.toLocaleString()}</p>
                    <p className="tooltip-contributors">👥 Contributors: {data.contributors.toLocaleString()}</p>
                    <p className="tooltip-size">📦 Size: {Math.round(Math.exp(data.size / 2)).toLocaleString()} KB</p>
                    <p className="tooltip-hint">点击查看仓库</p>
                </div>
            );
        }
        return null;
    };

    return (
        <ChartCard
            title="仓库星标与贡献者关系"
            description="此图表展示了仓库的星标数量与贡献者数量之间的关系。气泡大小表示仓库的代码量大小，颜色代表编程语言。点击气泡可跳转到对应的GitHub仓库。"
            className="stars-contributors-chart"
        >
            <div className="chart-filters">
                <div className="language-filter">
                    <label htmlFor="language-select">语言筛选:</label>
                    <select
                        id="language-select"
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                    >
                        {languages.map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                        ))}
                    </select>
                </div>

                <div className="stars-filter">
                    <label htmlFor="stars-slider">最小星标数: {minStars}</label>
                    <input
                        id="stars-slider"
                        type="range"
                        min="0"
                        max="10000"
                        step="100"
                        value={minStars}
                        onChange={(e) => setMinStars(parseInt(e.target.value, 10))}
                    />
                </div>
            </div>

            <div className="chart-stats">
                <div className="stat-item">
                    <span className="stat-label">仓库数量:</span>
                    <span className="stat-value">{chartData.length}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">总星标数:</span>
                    <span className="stat-value">
                        {chartData.reduce((sum, repo) => sum + repo.stars, 0).toLocaleString()}
                    </span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">平均贡献者:</span>
                    <span className="stat-value">
                        {chartData.length
                            ? Math.round(chartData.reduce((sum, repo) => sum + repo.contributors, 0) / chartData.length)
                            : 0}
                    </span>
                </div>
            </div>

            <div className="chart-container" style={{ height: 450 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 40, left: 30 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#555' : '#ddd'} />
                        <XAxis
                            type="number"
                            dataKey="contributors"
                            name="贡献者数量"
                            stroke={theme === 'dark' ? '#ccc' : '#666'}
                            tick={{ fill: theme === 'dark' ? '#ccc' : '#666' }}
                        >
                            <Label
                                value="贡献者数量"
                                position="bottom"
                                offset={10}
                                style={{ fill: theme === 'dark' ? '#ccc' : '#666' }}
                            />
                        </XAxis>
                        <YAxis
                            type="number"
                            dataKey="stars"
                            name="星标数量"
                            stroke={theme === 'dark' ? '#ccc' : '#666'}
                            tick={{ fill: theme === 'dark' ? '#ccc' : '#666' }}
                        >
                            <Label
                                value="星标数量"
                                angle={-90}
                                position="left"
                                offset={-15}
                                style={{ fill: theme === 'dark' ? '#ccc' : '#666' }}
                            />
                        </YAxis>
                        <ZAxis type="number" dataKey="size" range={[30, 1000]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />

                        {selectedLanguage === 'All' ? (
                            // 如果选择了所有语言，按语言分组显示
                            languages
                                .filter(lang => lang !== 'All')
                                .map(language => (
                                    <Scatter
                                        key={language}
                                        name={language}
                                        data={chartData.filter(item => item.language === language)}
                                        fill={getLanguageColor(language)}
                                        onClick={handleClickRepo}
                                        cursor="pointer"
                                    />
                                ))
                        ) : (
                            // 如果只选择了一种语言，只显示一个系列
                            <Scatter
                                name={selectedLanguage}
                                data={chartData}
                                fill={getLanguageColor(selectedLanguage)}
                                onClick={handleClickRepo}
                                cursor="pointer"
                            />
                        )}
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
};

export default StarsContributorsChart; 