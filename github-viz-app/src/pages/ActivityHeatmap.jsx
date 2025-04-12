import { useState, useEffect, useMemo } from 'react';
import API from '../config/api';

// 生成模拟热图数据
const generateMockHeatmapData = () => {
    const mockData = [];
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        mockData.push({
            date: date.toISOString().split('T')[0], // YYYY-MM-DD
            count: Math.floor(Math.random() * 30), // 随机贡献数
            weekday: date.getDay() // 0 (Sun) - 6 (Sat)
        });
    }
    return mockData.reverse(); // 确保日期升序
};

const ActivityHeatmap = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usingMockData, setUsingMockData] = useState(false);
    const [repositories, setRepositories] = useState([]); // 新增状态：仓库列表
    const [selectedRepo, setSelectedRepo] = useState('all'); // 新增状态：当前选择的仓库名 ('all' 表示所有)
    const [loadingRepos, setLoadingRepos] = useState(true); // 新增状态：加载仓库列表
    const [hoveredCell, setHoveredCell] = useState(null); // 新增状态：存储悬停单元格信息 { date, count }
    const [hoveredWeek, setHoveredWeek] = useState(null); // 新增状态：存储悬停的周信息

    // 效果1: 获取仓库列表
    useEffect(() => {
        async function fetchRepositories() {
            try {
                setLoadingRepos(true);
                const response = await fetch(API.repositoriesWithActivity); // 使用配置好的 API 端点
                if (!response.ok) throw new Error('获取仓库列表失败');
                const result = await response.json();
                setRepositories(result || []);
                console.log('获取到的仓库列表:', result);
            } catch (err) {
                console.error('获取仓库列表出错:', err);
                setError('无法加载仓库列表: ' + err.message);
                setRepositories([]); // 出错时清空列表
            } finally {
                setLoadingRepos(false);
            }
        }
        fetchRepositories();
    }, []); // 这个 effect 只运行一次

    // 效果2: 获取热图数据 (依赖于 selectedRepo)
    useEffect(() => {
        async function fetchHeatmapData() {
            setLoading(true);
            setError(null);
            setUsingMockData(false);
            let url = API.activityHeatmap;
            if (selectedRepo && selectedRepo !== 'all') {
                url += `?repoName=${encodeURIComponent(selectedRepo)}`; // 如果选择了特定仓库，添加查询参数
            }
            console.log(`请求热图数据 URL: ${url}`);

            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('API 请求失败');

                const result = await response.json();
                console.log(`从API获取的活动热图数据 (仓库: ${selectedRepo}):`, result);

                if (!result || !Array.isArray(result) || result.length === 0) {
                    console.warn(`从API获取的活动数据为空 (仓库: ${selectedRepo})，将使用模拟数据。`);
                    setData(generateMockHeatmapData());
                    setUsingMockData(true);
                } else {
                    setData(result);
                }

            } catch (err) {
                setError(err.message);
                console.error(`获取活动热图数据出错 (仓库: ${selectedRepo})，将使用模拟数据:`, err);
                setData(generateMockHeatmapData());
                setUsingMockData(true);
            } finally {
                setLoading(false);
            }
        }

        fetchHeatmapData(); // 调用函数获取数据
    }, [selectedRepo]); // 当 selectedRepo 改变时，重新运行这个 effect

    // 处理仓库选择变化
    const handleRepoChange = (event) => {
        setSelectedRepo(event.target.value);
    };

    // 新增：处理鼠标进入单元格
    const handleMouseEnter = (cellData) => {
        setHoveredCell(cellData);
    };

    // 新增：处理鼠标离开单元格
    const handleMouseLeave = () => {
        setHoveredCell(null);
    };

    // 新增：处理鼠标进入周条形图
    const handleWeekMouseEnter = (weekData) => {
        setHoveredWeek(weekData);
    };

    // 新增：处理鼠标离开周条形图
    const handleWeekMouseLeave = () => {
        setHoveredWeek(null);
    };

    // 渲染加载状态
    if (loadingRepos) return <div className="loading-indicator">加载仓库列表中...</div>;
    // 注意：我们将热图的加载状态放在后面，因为仓库列表加载完成后才显示下拉框

    // 处理数据，确保每个日期项都有完整的信息
    const processedDays = data.map(item => ({
        date: item.date,
        count: item.count || 0,
        weekday: item.weekday !== undefined ? item.weekday : new Date(item.date).getDay()
    }));

    // 计算统计信息
    const totalContributions = processedDays.reduce((sum, day) => sum + day.count, 0);
    const averageDailyContributions = Math.round(totalContributions / processedDays.length);
    const mostActiveDay = processedDays.reduce(
        (max, day) => (day.count > max.count ? day : max),
        { date: '', count: 0 }
    );

    // 根据贡献数计算热图单元格的颜色
    const getHeatmapColor = (count) => {
        if (count === 0) return '#ebedf0';
        if (count < 5) return '#9be9a8';
        if (count < 10) return '#40c463';
        if (count < 20) return '#30a14e';
        return '#216e39';
    };

    // 将日期格式化为可读形式
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        // 修改为更简洁的格式用于Tooltip
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // 计算每月的位置，用于显示月份标签
    const getMonthLabels = () => {
        const months = [];
        let currentMonth = -1;

        processedDays.forEach((day, index) => {
            const month = new Date(day.date).getMonth();
            if (month !== currentMonth) {
                months.push({
                    name: new Date(day.date).toLocaleDateString('zh-CN', { month: 'short' }),
                    index
                });
                currentMonth = month;
            }
        });

        return months;
    };

    // 计算热图的行列数
    const getGridDimensions = () => {
        const weeks = Math.ceil(processedDays.length / 7);
        return {
            rows: 7,
            columns: weeks
        };
    };

    // 计算每周的贡献
    const getWeeksData = () => {
        const weeks = [];
        const sortedDays = [...processedDays].sort((a, b) => new Date(a.date) - new Date(b.date));

        for (let i = 0; i < sortedDays.length; i += 7) {
            const weekDays = sortedDays.slice(i, i + 7);
            if (weekDays.length > 0) {
                const weekTotal = weekDays.reduce((sum, day) => sum + day.count, 0);
                weeks.push({
                    startDate: weekDays[0].date,
                    endDate: weekDays[weekDays.length - 1].date,
                    total: weekTotal
                });
            }
        }

        return weeks;
    };

    // 新增：格式化日期范围的辅助函数
    const formatDateRange = (startDateStr, endDateStr) => {
        const start = new Date(startDateStr);
        const end = new Date(endDateStr);
        const startMonth = start.toLocaleDateString('zh-CN', { month: 'short' });
        const startDay = start.toLocaleDateString('zh-CN', { day: 'numeric' });
        const endMonth = end.toLocaleDateString('zh-CN', { month: 'short' });
        const endDay = end.toLocaleDateString('zh-CN', { day: 'numeric' });

        if (startMonth === endMonth) {
            return `${startMonth}${startDay} - ${endDay}`;
        } else {
            return `${startMonth}${startDay} - ${endMonth}${endDay}`;
        }
    };

    const { rows, columns } = getGridDimensions();
    const weeks = getWeeksData();
    const monthLabels = getMonthLabels();

    // 月份标签的内联样式
    const monthLabelsStyle = {
        gridArea: 'months',
        display: 'grid',
        gridAutoFlow: 'column',
        gridAutoColumns: '50px',
        alignItems: 'end',
        paddingLeft: '5px',
        gap: '3px',
        marginLeft: '8px'
    };

    // 单个月份标签样式
    const monthLabelStyle = {
        fontSize: '0.65rem',
        color: 'var(--light-text-secondary)',
        textAlign: 'left',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        transform: 'rotate(-45deg)', // 旋转以减少占用空间
        transformOrigin: 'left bottom',
        marginLeft: '-8px'
    };

    // 星期标签容器样式
    const weekdayLabelsStyle = {
        gridArea: 'days',
        display: 'grid',
        gridTemplateRows: 'repeat(7, 10px)', // 减小行高
        gap: '3px', // 减小间隙
        alignItems: 'center',
        paddingRight: '10px',
        width: '50px' // 增加宽度提供更多空间
    };

    // 单个星期标签样式
    const weekdayLabelStyle = {
        fontSize: '0.65rem',
        color: 'var(--light-text-secondary)',
        textAlign: 'right',
        lineHeight: '1',
        whiteSpace: 'nowrap',
        paddingTop: '1px'
    };

    // 热图网格样式
    const heatmapGridStyle = {
        gridArea: 'grid',
        display: 'grid',
        gap: '3px', // 减小间隙使热图更紧凑
        gridTemplateColumns: `repeat(${columns}, 10px)`, // 单元格宽度为10px
        gridTemplateRows: `repeat(${rows}, 10px)` // 单元格高度为10px
    };

    // 热图单元格样式
    const getCellStyle = (count) => ({
        width: '10px',
        height: '10px',
        borderRadius: '2px',
        backgroundColor: getHeatmapColor(count),
        border: '1px solid rgba(0,0,0,0.05)'
    });

    return (
        <div className="activity-heatmap-page">
            <div className="page-header-controls">
                <h1 className="page-title">活跃度热图</h1>
                {/* 添加仓库选择器 */}
                <div className="repo-selector">
                    <label htmlFor="repoSelect">选择仓库:</label>
                    <select id="repoSelect" value={selectedRepo} onChange={handleRepoChange} disabled={loadingRepos || loading}>
                        <option value="all">所有仓库 (聚合)</option>
                        {repositories.map(repo => (
                            <option key={repo.repo_id || repo.repo_name} value={repo.repo_name}>
                                {repo.repo_name}
                            </option>
                        ))}
                    </select>
                    {(loadingRepos || loading) && <span className="loading-spinner-small"></span>}
                </div>
            </div>

            {/* 加载和错误提示 */}
            {loading && !loadingRepos && <div className="loading-container">
                <div className="spinner"></div>
                <div className="loading-text">加载热图数据中...</div>
            </div>}
            {error && <div className="error-message">加载数据出错 ({error}){(usingMockData ? ", 当前显示模拟数据。" : "")}</div>}
            {usingMockData && !error && <div className="mock-data-notice">未能获取到真实活动数据，当前显示模拟数据。</div>}

            {/* 主要内容区域 */}
            {!loading && (
                <>
                    <div className="stats-overview">
                        <div className="card stat-card">
                            <div className="stat-value">{totalContributions.toLocaleString()}</div>
                            <div className="stat-label">总贡献数</div>
                        </div>
                        <div className="card stat-card">
                            <div className="stat-value">{averageDailyContributions}</div>
                            <div className="stat-label">日均贡献</div>
                        </div>
                        {mostActiveDay && mostActiveDay.date && (
                            <div className="card stat-card">
                                <div className="stat-value">{formatDate(mostActiveDay.date)}</div>
                                <div className="stat-label">过去一年最活跃的一天</div>
                                <div className="stat-description">{mostActiveDay.count} 次贡献</div>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">年度贡献热图</h2>
                        </div>
                        <div className="card-body">
                            <div className="heatmap-container">
                                {/* 月份标签 - 使用内联样式 */}
                                <div style={monthLabelsStyle}>
                                    {monthLabels.map((month, idx) => (
                                        <div key={`${month.name}-${idx}`} style={monthLabelStyle}>
                                            {month.name}
                                        </div>
                                    ))}
                                </div>

                                {/* 星期标签 - 使用内联样式 */}
                                <div style={weekdayLabelsStyle}>
                                    <div style={weekdayLabelStyle}>周日</div>
                                    <div style={weekdayLabelStyle}>周一</div>
                                    <div style={weekdayLabelStyle}>周二</div>
                                    <div style={weekdayLabelStyle}>周三</div>
                                    <div style={weekdayLabelStyle}>周四</div>
                                    <div style={weekdayLabelStyle}>周五</div>
                                    <div style={weekdayLabelStyle}>周六</div>
                                </div>

                                {/* 热图网格 - 使用内联样式 */}
                                <div style={heatmapGridStyle}>
                                    {processedDays.map((day, index) => (
                                        <div
                                            key={day.date || index}
                                            className={`heatmap-cell ${hoveredCell && hoveredCell.date === day.date ? 'hovered' : ''}`}
                                            style={{
                                                ...getCellStyle(day.count),
                                                gridRow: day.weekday + 1,
                                                gridColumn: Math.floor(index / 7) + 1
                                            }}
                                            onMouseEnter={() => handleMouseEnter({ date: day.date, count: day.count })}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            {/* 添加自定义 Tooltip */}
                                            {hoveredCell && hoveredCell.date === day.date && (
                                                <div className="heatmap-tooltip">
                                                    <strong>{hoveredCell.count} commit</strong> on {formatDate(hoveredCell.date)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="heatmap-legend">
                                <div className="legend-label">较少</div>
                                {[0, 4, 9, 19, 30].map(value => (
                                    <div
                                        key={value}
                                        className="legend-cell"
                                        style={{ backgroundColor: getHeatmapColor(value) }}
                                    />
                                ))}
                                <div className="legend-label">较多</div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">最近活动</h2>
                        </div>
                        <div className="card-body">
                            <div className="recent-activity">
                                <div className="activity-chart">
                                    {weeks.slice(-10).map((week, idx) => (
                                        <div
                                            key={`${week.startDate}-${idx}`}
                                            className={`week-bar ${hoveredWeek && hoveredWeek.startDate === week.startDate ? 'hovered' : ''}`}
                                            onMouseEnter={() => handleWeekMouseEnter(week)}
                                            onMouseLeave={handleWeekMouseLeave}
                                            title={`${formatDateRange(week.startDate, week.endDate)}: ${week.total} 次贡献`}
                                        >
                                            <div className="week-date">
                                                {formatDateRange(week.startDate, week.endDate)}
                                            </div>
                                            <div className="bar-container">
                                                <div
                                                    className="bar-fill"
                                                    style={{
                                                        width: `${Math.min((week.total / 150) * 100, 100)}%`,
                                                        backgroundColor: '#3b82f6'
                                                    }}
                                                ></div>
                                                <span className="bar-value">
                                                    {week.total}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ActivityHeatmap; 