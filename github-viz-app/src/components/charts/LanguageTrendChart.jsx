import { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { useGitHubData } from '../../contexts/GitHubDataContext';
import { useTheme } from '../../contexts/ThemeContext';
import ChartCard from '../ui/ChartCard';

const LanguageTrendChart = () => {
    const { activities, repositories } = useGitHubData();
    const { theme } = useTheme();
    const [chartData, setChartData] = useState([]);
    const [selectedLanguages, setSelectedLanguages] = useState([]);
    const [availableLanguages, setAvailableLanguages] = useState([]);
    const [timeRange, setTimeRange] = useState('year'); // month, quarter, year

    // 随机生成色彩
    const generateRandomColor = () => {
        const hue = Math.floor(Math.random() * 360);
        return `hsl(${hue}, 70%, 60%)`;
    };

    // 处理语言列表
    useEffect(() => {
        if (repositories.length) {
            const langs = repositories
                .map(repo => repo.language)
                .filter(Boolean)
                .filter((lang, index, self) => self.indexOf(lang) === index)
                .sort();

            setAvailableLanguages(langs);

            // 默认选择前5种语言
            if (!selectedLanguages.length && langs.length) {
                setSelectedLanguages(langs.slice(0, 5));
            }
        }
    }, [repositories, selectedLanguages.length]);

    // 处理图表数据
    useEffect(() => {
        if (activities.length && selectedLanguages.length) {
            const now = new Date();
            let startDate;

            // 设置时间范围
            switch (timeRange) {
                case 'month':
                    startDate = new Date(now);
                    startDate.setMonth(now.getMonth() - 1);
                    break;
                case 'quarter':
                    startDate = new Date(now);
                    startDate.setMonth(now.getMonth() - 3);
                    break;
                case 'year':
                default:
                    startDate = new Date(now);
                    startDate.setFullYear(now.getFullYear() - 1);
                    break;
            }

            // 筛选时间范围内的活动数据
            const filteredActivities = activities.filter(activity => {
                const activityDate = new Date(activity.date);
                return activityDate >= startDate && activityDate <= now;
            });

            // 按月份分组
            const groupedByMonth = filteredActivities.reduce((groups, activity) => {
                const activityDate = new Date(activity.date);
                const monthKey = `${activityDate.getFullYear()}-${String(activityDate.getMonth() + 1).padStart(2, '0')}`;

                if (!groups[monthKey]) {
                    groups[monthKey] = { date: monthKey };
                    selectedLanguages.forEach(lang => {
                        groups[monthKey][lang] = 0;
                    });
                }

                // 查找对应仓库的语言
                const repo = repositories.find(r => r.id === activity.repo_id);
                if (repo && selectedLanguages.includes(repo.language)) {
                    groups[monthKey][repo.language] += activity.stars_count;
                }

                return groups;
            }, {});

            // 转换为数组并排序
            const chartData = Object.values(groupedByMonth).sort((a, b) => a.date.localeCompare(b.date));
            setChartData(chartData);
        }
    }, [activities, repositories, selectedLanguages, timeRange]);

    // 处理语言选择
    const handleLanguageToggle = (language) => {
        setSelectedLanguages(prev => {
            if (prev.includes(language)) {
                return prev.filter(lang => lang !== language);
            } else {
                return [...prev, language];
            }
        });
    };

    // 更改时间范围
    const handleTimeRangeChange = (e) => {
        setTimeRange(e.target.value);
    };

    // 语言颜色映射
    const languageColors = {};
    selectedLanguages.forEach(lang => {
        if (!languageColors[lang]) {
            languageColors[lang] = generateRandomColor();
        }
    });

    return (
        <ChartCard title="编程语言趋势变化" className="language-trend-chart">
            <div className="chart-filters">
                <div className="language-selector">
                    <h4>选择语言:</h4>
                    <div className="language-tags">
                        {availableLanguages.map(language => (
                            <button
                                key={language}
                                className={`language-tag ${selectedLanguages.includes(language) ? 'selected' : ''}`}
                                onClick={() => handleLanguageToggle(language)}
                                style={{
                                    backgroundColor: selectedLanguages.includes(language) ? languageColors[language] : 'transparent',
                                    color: selectedLanguages.includes(language) ? '#fff' : theme === 'dark' ? '#fff' : '#333',
                                    borderColor: languageColors[language] || '#ccc'
                                }}
                            >
                                {language}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="time-range-selector">
                    <h4>时间范围:</h4>
                    <select value={timeRange} onChange={handleTimeRangeChange}>
                        <option value="month">最近一个月</option>
                        <option value="quarter">最近一季度</option>
                        <option value="year">最近一年</option>
                    </select>
                </div>
            </div>

            <div className="chart-container" style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#555' : '#ddd'} />
                        <XAxis
                            dataKey="date"
                            stroke={theme === 'dark' ? '#ccc' : '#666'}
                            tick={{ fill: theme === 'dark' ? '#ccc' : '#666' }}
                        />
                        <YAxis
                            stroke={theme === 'dark' ? '#ccc' : '#666'}
                            tick={{ fill: theme === 'dark' ? '#ccc' : '#666' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: theme === 'dark' ? '#333' : '#fff',
                                color: theme === 'dark' ? '#fff' : '#333',
                                border: `1px solid ${theme === 'dark' ? '#555' : '#ddd'}`
                            }}
                        />
                        <Legend />
                        {selectedLanguages.map((language) => (
                            <Line
                                key={language}
                                type="monotone"
                                dataKey={language}
                                name={language}
                                stroke={languageColors[language]}
                                activeDot={{ r: 8 }}
                                strokeWidth={2}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </ChartCard>
    );
};

export default LanguageTrendChart; 