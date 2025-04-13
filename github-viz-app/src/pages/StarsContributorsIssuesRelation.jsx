import { useState, useEffect, useMemo } from 'react';
import API from '../config/api';
// Import components from previous pages (we might reuse parts)
// import { ScatterPlot as StarsContributorsPlot, ProjectTable as StarsContributorsTable } from './StarsContributorsRelation'; // Assuming you modularize them
// import { ScatterPlot as StarsIssuesPlot, ProjectTable as StarsIssuesTable, RatioAnalysis } from './StarsIssuesRelation'; // Assuming you modularize them

// Helper function for language color (can be moved to a utils file)
const getLanguageColor = (language) => {
    const colorMap = {
        JavaScript: '#f1e05a', TypeScript: '#2b7489', Python: '#3572A5',
        Java: '#b07219', Go: '#00ADD8', 'C++': '#f34b7d', Ruby: '#701516',
        PHP: '#4F5D95', Rust: '#dea584', 'C#': '#178600', Swift: '#ffac45',
        Kotlin: '#F18E33', C: '#555555', Shell: '#89e051', HTML: '#e34c26',
        CSS: '#563d7c'
    };
    return colorMap[language] || '#cccccc';
};

const StarsContributorsIssuesRelation = () => {
    const [contributorsData, setContributorsData] = useState([]);
    const [issuesData, setIssuesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeView, setActiveView] = useState('overview'); // 'overview', 'contributors', 'issues'
    const [hoveredRepoContributors, setHoveredRepoContributors] = useState(null);
    const [hoveredRepoIssues, setHoveredRepoIssues] = useState(null);

    // NEW state for iframe loading status
    const [iframeLoading, setIframeLoading] = useState(true);

    // *** NEW: State for selected languages ***
    const [selectedLanguages, setSelectedLanguages] = useState([]);

    // --- Constants for Log Scale Maximums (Adjust these based on your data range if needed) ---
    const MAX_LOG_STARS = Math.log10(500000);// e.g., up to 500k stars on log scale
    const BACE_LOG_STARS = Math.log10(1000);
    const MAX_LOG_CONTRIBUTORS = Math.log10(600); // e.g., up to 10k contributors on log scale
    const MAX_LOG_ISSUES = Math.log10(20000); // e.g., up to 20k issues on log scale

    // Helper function to calculate logarithmic position
    const getLogPosition = (value, maxLogValue) => {
        const logValue = Math.log10(Math.max(1, value)); // Use log10(1) = 0 for values <= 1
        // Normalize to 0-100, cap at 98% to leave space for labels/ticks
        return Math.min((logValue / maxLogValue) * 100, 96);
    };

    const getLogPosition_stars = (value, maxLogValue, baseLogValue) => {
        const logValue = Math.log10(Math.max(1, value)); // Use log10(1) = 0 for values <= 1
        // Normalize to 0-100, cap at 98% to leave space for labels/ticks
        return Math.min(((logValue / maxLogValue) - (baseLogValue / maxLogValue)) / (1 - (baseLogValue / maxLogValue)) * 100, 98);
    };

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                const [contributorsRes, issuesRes] = await Promise.all([
                    fetch(API.starsContributors),
                    fetch(API.starsIssues)
                ]);

                if (!contributorsRes.ok) throw new Error('获取星标与贡献者数据失败');
                const contributorsResult = await contributorsRes.json();
                setContributorsData(contributorsResult || []); // Ensure array

                if (!issuesRes.ok) throw new Error('获取星标与问题数据失败');
                const issuesResult = await issuesRes.json();
                setIssuesData(issuesResult || []); // Ensure array

                // *** Initialize selected languages after data fetch ***
                const langSet = new Set();
                (contributorsResult || []).forEach(repo => repo.language && langSet.add(repo.language));
                (issuesResult || []).forEach(repo => repo.language && langSet.add(repo.language));
                const allLangs = Array.from(langSet).sort();
                setSelectedLanguages(allLangs); // Default select all languages

            } catch (err) {
                setError(err.message);
                console.error('获取数据出错:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    // *** Extract available languages using useMemo ***
    const availableLanguages = useMemo(() => {
        const langSet = new Set();
        // Use the state data which might be empty initially
        contributorsData.forEach(repo => repo.language && langSet.add(repo.language));
        issuesData.forEach(repo => repo.language && langSet.add(repo.language));
        return Array.from(langSet).sort();
    }, [contributorsData, issuesData]); // Recalculate when data changes

    // *** Function to toggle language selection ***
    const toggleLanguage = (language) => {
        setSelectedLanguages(prev =>
            prev.includes(language)
                ? prev.filter(lang => lang !== language) // Deselect
                : [...prev, language] // Select
        );
    };

    // Combine data for overview (might need adjustments based on data structure)
    // For simplicity, we'll use separate data for now.
    // A more robust approach would merge them based on repo_name if IDs aren't consistent.

    // --- Calculate Overview Stats ---
    const uniqueRepos = new Set([...contributorsData.map(r => r.repo_name), ...issuesData.map(r => r.repo_name)]);
    const totalRepositories = uniqueRepos.size;

    // Use contributorsData for stars and contributors count as it likely has both
    const totalStars = contributorsData.reduce((sum, repo) => sum + (repo.stars || 0), 0);
    const totalContributors = contributorsData.reduce((sum, repo) => sum + (repo.contributors_count || 0), 0);

    // Use issuesData for issues count
    const totalIssues = issuesData.reduce((sum, repo) => sum + (repo.open_issues || 0), 0);

    const averageStarsPerContributor = totalContributors > 0 ? Math.round(totalStars / totalContributors) : 0;
    const averageStarsPerIssue = totalIssues > 0 ? Math.round(totalStars / totalIssues) : 0;
    const averageIssuesPerRepo = totalRepositories > 0 ? Math.round(totalIssues / totalRepositories) : 0;


    // --- Render Logic ---
    if (loading) return <div className="loading-indicator">数据加载中...</div>;
    if (error) return <div className="error-message">加载出错: {error}</div>;

    return (
        <div className="stars-contributors-issues-page">
            <div className="page-header-controls">
                <h1 className="page-title">星标、贡献者与问题关系</h1>
                <div className="radio-inputs">
                    <label className="radio">
                        <input
                            type="radio"
                            name="view"
                            value="overview"
                            checked={activeView === 'overview'}
                            onChange={() => setActiveView('overview')}
                        />
                        <span className="name">概览</span>
                    </label>
                    <label className="radio">
                        <input
                            type="radio"
                            name="view"
                            value="contributors"
                            checked={activeView === 'contributors'}
                            onChange={() => setActiveView('contributors')}
                        />
                        <span className="name">星标 vs 贡献者</span>
                    </label>
                    <label className="radio">
                        <input
                            type="radio"
                            name="view"
                            value="issues"
                            checked={activeView === 'issues'}
                            onChange={() => setActiveView('issues')}
                        />
                        <span className="name">星标 vs 问题</span>
                    </label>
                </div>
            </div>

            {/* View Content */}
            {activeView === 'overview' && (
                <div className="overview-section">
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">总体统计</h2>
                        </div>
                        <div className="card-body">
                            <div className="stats-overview">
                                <div className="stat-card">
                                    <div className="stat-value">{totalRepositories.toLocaleString()}</div>
                                    <div className="stat-label">分析仓库数</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{totalStars.toLocaleString()}</div>
                                    <div className="stat-label">总星标数</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{totalContributors.toLocaleString()}</div>
                                    <div className="stat-label">总贡献者数</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{totalIssues.toLocaleString()}</div>
                                    <div className="stat-label">总问题数</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{averageStarsPerContributor.toLocaleString()}</div>
                                    <div className="stat-label">平均星标/贡献者</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{averageStarsPerIssue.toLocaleString()}</div>
                                    <div className="stat-label">平均星标/问题</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">{averageIssuesPerRepo.toLocaleString()}</div>
                                    <div className="stat-label">平均问题/仓库</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">关系图概览</h2>
                        </div>
                        <div className="card-body" >
                            {iframeLoading && (
                                <div className="loading-container centered">
                                    <div className="spinner"></div>
                                    <div className="loading-text">正在加载图片...</div>
                                </div>
                            )}
                            <iframe
                                src="pic3_1.html"
                                title="嵌入式模块"
                                onLoad={() => setIframeLoading(false)}
                                style={{
                                    width: '100%',
                                    height: '500px',
                                    border: 'none',
                                    display: iframeLoading ? 'none' : 'block',
                                    margin: '0 auto',
                                    borderRadius: 'var(--border-radius-md)'
                                }}
                            >
                                您的浏览器不支持 iframe。
                            </iframe>
                        </div>
                    </div>
                </div>
            )}

            {activeView === 'contributors' && (
                <div className="contributors-section">
                    {!contributorsData || !Array.isArray(contributorsData) || contributorsData.length === 0 ? (
                        <div className="empty-data">没有星标与贡献者关系数据</div>
                    ) : (<>
                        {/* *** Language Filter Card *** */}
                        {/*<div className="card">
                            <div className="card-header">
                                <h2 className="card-title">语言筛选</h2>
                                <div className="header-actions">
                                    <button className="button-link" onClick={() => setSelectedLanguages(availableLanguages)}>全选</button>
                                    <button className="button-link" onClick={() => setSelectedLanguages([])}>全不选</button>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="language-toggles">
                                    {availableLanguages.map(lang => (
                                        <button
                                            key={lang}
                                            className={`language-toggle ${selectedLanguages.includes(lang) ? 'active' : ''}`}
                                            onClick={() => toggleLanguage(lang)}
                                            style={{
                                                borderColor: getLanguageColor(lang),
                                                backgroundColor: selectedLanguages.includes(lang) ? getLanguageColor(lang) : 'transparent',
                                                color: selectedLanguages.includes(lang) ? '#fff' : 'inherit'
                                            }}
                                        >
                                            {lang || '未知'} {/* Handle null/undefined language name 
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>*/}

                        <div className="stats-overview">
                            <div className="card stat-card">
                                <div className="stat-value">{contributorsData.length.toLocaleString()}</div>
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
                                <div className="card">
                                    <div className="card-header">
                                        <h2 className="card-title">语言筛选</h2>
                                        <div className="header-actions">
                                            <button className="buttonselection" onClick={() => setSelectedLanguages(availableLanguages)}>全选</button>
                                            <button className="buttonselection" onClick={() => setSelectedLanguages([])}>全不选</button>
                                            <button className="buttonselection" onClick={() => setSelectedLanguages(['C++', 'Java', 'Python', 'JavaScript', 'Go', 'TypeScript', 'Rust'])}>热门语言</button>
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <div className="language-toggles">
                                            {availableLanguages.map(lang => (
                                                <button
                                                    key={lang}
                                                    className={`language-toggle ${selectedLanguages.includes(lang) ? 'active' : ''}`}
                                                    onClick={() => toggleLanguage(lang)}
                                                    style={{
                                                        borderColor: getLanguageColor(lang),
                                                        backgroundColor: selectedLanguages.includes(lang) ? getLanguageColor(lang) : 'transparent',
                                                        color: selectedLanguages.includes(lang) ? '#fff' : 'inherit'
                                                    }}
                                                >
                                                    {lang || '未知'} {/* Handle null/undefined language name */}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="scatter-plot-container">
                                    <div className="scatter-plot">
                                        {contributorsData
                                            // *** Filter by selected languages ***
                                            .filter(repo => selectedLanguages.includes(repo.language))
                                            .map((repo, index) => {
                                                const stars = repo.stars || 0;
                                                const contributors = repo.contributors_count || 0;
                                                const xPos = getLogPosition_stars(stars, MAX_LOG_STARS, BACE_LOG_STARS);
                                                const yPos = getLogPosition(contributors, MAX_LOG_CONTRIBUTORS);

                                                return (
                                                    <div
                                                        key={`contrib-${repo.repo_id || index}`}
                                                        className="scatter-point"
                                                        style={{
                                                            left: `${xPos}%`,
                                                            bottom: `${0.9 * yPos + 10}%`,
                                                            backgroundColor: getLanguageColor(repo.language),
                                                            transform: hoveredRepoContributors === index ? 'scale(1)' : 'scale(0.25)',
                                                            opacity: hoveredRepoContributors === null || hoveredRepoContributors === index ? 1 : 0.5, // Dim others on hover
                                                            zIndex: hoveredRepoContributors === index ? 10 : 1, // Bring hovered to front
                                                        }}
                                                        onMouseEnter={() => setHoveredRepoContributors(index)}
                                                        onMouseLeave={() => setHoveredRepoContributors(null)}
                                                        title={`${repo.repo_name}: ${stars.toLocaleString()} stars, ${contributors.toLocaleString()} contributors`}
                                                    >
                                                        {hoveredRepoContributors === index && (
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
                                            <div className="axis-ticks">
                                                <span>0</span>
                                                <span>80k</span>
                                                <span>160k</span>
                                                <span>35k</span>
                                                <span>105k</span>
                                                <span>400k+</span>
                                            </div>
                                            <div className="axis-label">星标数</div>
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
                                {/* Add message if filter results in no points */}
                                {contributorsData.filter(repo => selectedLanguages.includes(repo.language)).length === 0 && availableLanguages.length > 0 && (
                                    <p className="empty-data-small">当前语言筛选条件下无数据点。</p>
                                )}
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
                                            {contributorsData
                                                .slice()
                                                .sort((a, b) => (b.stars || 0) - (a.stars || 0))
                                                // *** Filter by selected languages ***
                                                .filter(repo => selectedLanguages.includes(repo.language))
                                                .slice(0, 100)
                                                .map((repo, index) => (
                                                    <tr key={`contrib-table-${repo.repo_id || index}`}>
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
                                {/* Add message if filter results in no rows */}
                                {contributorsData.filter(repo => selectedLanguages.includes(repo.language)).length === 0 && availableLanguages.length > 0 && (
                                    <p className="empty-data-small">当前语言筛选条件下无项目详情。</p>
                                )}
                            </div>
                        </div>
                    </>)}
                </div>
            )}

            {activeView === 'issues' && (
                <div className="issues-section">
                    {!issuesData || !Array.isArray(issuesData) || issuesData.length === 0 ? (
                        <div className="empty-data">没有星标与问题关系数据</div>
                    ) : (<>
                        {/* *** Language Filter Card (Duplicate for this view) *** */}
                        {/*<div className="card">
                            <div className="card-header">
                                <h2 className="card-title">语言筛选</h2>
                                <div className="header-actions">
                                    <button className="button-link" onClick={() => setSelectedLanguages(availableLanguages)}>全选</button>
                                    <button className="button-link" onClick={() => setSelectedLanguages([])}>全不选</button>
                                </div>
                            </div>
                                <div className="card-body">
                                    <div className="language-toggles">
                                        {availableLanguages.map(lang => (
                                            <button
                                                key={lang}
                                                className={`language-toggle ${selectedLanguages.includes(lang) ? 'active' : ''}`}
                                                onClick={() => toggleLanguage(lang)}
                                                style={{
                                                    borderColor: getLanguageColor(lang),
                                                    backgroundColor: selectedLanguages.includes(lang) ? getLanguageColor(lang) : 'transparent',
                                                    color: selectedLanguages.includes(lang) ? '#fff' : 'inherit'
                                                }}
                                            >
                                                {lang || '未知'} {/* Handle null/undefined language name 
                                            </button>
                                        ))}
                                    </div>
                                </div>
                        </div>*/}

                        <div className="stats-overview">
                            <div className="card stat-card">
                                <div className="stat-value">{issuesData.length.toLocaleString()}</div>
                                <div className="stat-label">热门项目</div>
                            </div>
                            <div className="card stat-card">
                                <div className="stat-value">{issuesData.reduce((sum, repo) => sum + (repo.stars || 0), 0).toLocaleString()}</div>
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
                                <div className="card">
                                    <div className="card-header">
                                        <h2 className="card-title">语言筛选</h2>
                                        <div className="header-actions">
                                            <button className="buttonselection" onClick={() => setSelectedLanguages(availableLanguages)}>全选</button>
                                            <button className="buttonselection" onClick={() => setSelectedLanguages([])}>全不选</button>
                                            <button className="buttonselection" onClick={() => setSelectedLanguages([ 'C++',  'Java', 'Python', 'JavaScript', 'Go',  'TypeScript', 'Rust'])}>热门语言</button>
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <div className="language-toggles">
                                            {availableLanguages.map(lang => (
                                                <button
                                                    key={lang}
                                                    className={`language-toggle ${selectedLanguages.includes(lang) ? 'active' : ''}`}
                                                    onClick={() => toggleLanguage(lang)}
                                                    style={{
                                                        borderColor: getLanguageColor(lang),
                                                        backgroundColor: selectedLanguages.includes(lang) ? getLanguageColor(lang) : 'transparent',
                                                        color: selectedLanguages.includes(lang) ? '#fff' : 'inherit'
                                                    }}
                                                >
                                                    {lang || '未知'} {/* Handle null/undefined language name */}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="scatter-plot-container">
                                    <div className="scatter-plot">
                                        {issuesData
                                            // *** Filter by selected languages ***
                                            .filter(repo => selectedLanguages.includes(repo.language))
                                            .map((repo, index) => {
                                                const stars = repo.stars || 0;
                                                const issues = repo.open_issues || 0;
                                                const xPos = getLogPosition_stars(stars, MAX_LOG_STARS, BACE_LOG_STARS);
                                                const yPos = getLogPosition(issues, MAX_LOG_ISSUES);

                                                return (
                                                    <div
                                                        key={`issue-${repo.repo_id || index}`}
                                                        className="scatter-point"
                                                        style={{
                                                            left: `${xPos}%`,
                                                            bottom: `${0.9 * yPos + 10}%`,
                                                            backgroundColor: getLanguageColor(repo.language),
                                                            transform: hoveredRepoIssues === index ? 'scale(1)' : 'scale(0.25)',
                                                            opacity: hoveredRepoIssues === null || hoveredRepoIssues === index ? 1 : 0.5,
                                                            zIndex: hoveredRepoIssues === index ? 10 : 1,
                                                        }}
                                                        onMouseEnter={() => setHoveredRepoIssues(index)}
                                                        onMouseLeave={() => setHoveredRepoIssues(null)}
                                                        title={`${repo.repo_name}: ${stars.toLocaleString()} stars, ${issues.toLocaleString()} issues`}
                                                    >
                                                        {hoveredRepoIssues === index && (
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
                                            <div className="axis-ticks">
                                                <span>0</span>
                                                <span>10k</span>
                                                <span>20k</span>
                                                <span>35k</span>
                                                <span>105k</span>
                                                <span>400k+</span>
                                            </div>
                                            <div className="axis-label">星标数</div>
                                        </div>
                                        <div className="scatter-plot-axis y-axis">
                                            <div className="axis-label">问题数</div>
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
                                {/* Add message if filter results in no points */}
                                {issuesData.filter(repo => selectedLanguages.includes(repo.language)).length === 0 && availableLanguages.length > 0 && (
                                    <p className="empty-data-small">当前语言筛选条件下无数据点。</p>
                                )}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">星标与问题比率分析</h2>
                            </div>
                            <div className="card-body">
                                {(() => {
                                    const ratioGroups = [
                                        { name: '低星标高问题比', min: 0, max: 10, count: 0 },
                                        { name: '中等比率', min: 10, max: 50, count: 0 },
                                        { name: '高星标低问题比', min: 50, max: Infinity, count: 0 }
                                    ];
                                    let validRatioCount = 0;
                                    issuesData.forEach(repo => {
                                        const stars = repo.stars || 0;
                                        const issues = repo.open_issues;
                                        if (typeof issues === 'number' && issues >= 0) {
                                            validRatioCount++;
                                            const ratio = issues === 0 ? Infinity : stars / issues;
                                            ratioGroups.forEach(group => {
                                                if (ratio >= group.min && ratio < group.max) {
                                                    group.count++;
                                                }
                                            });
                                        }
                                    });

                                    const totalValidIssues = issuesData.reduce((sum, repo) => sum + (typeof repo.open_issues === 'number' ? repo.open_issues : 0), 0);
                                    const averageIssuesPerRepoValid = validRatioCount > 0 ? Math.round(totalValidIssues / validRatioCount) : 0;
                                    const totalStarsForValidIssues = issuesData.reduce((sum, repo) => sum + (typeof repo.open_issues === 'number' ? (repo.stars || 0) : 0), 0);
                                    const averageStarsPerIssueValid = totalValidIssues > 0 ? Math.round(totalStarsForValidIssues / totalValidIssues) : 0;

                                    return (
                                        <div className="ratio-analysis">
                                            <div className="ratio-chart">
                                                {ratioGroups.map((group, index) => (
                                                    <div key={index} className="ratio-bar">
                                                        <div className="ratio-label">{group.name}</div>
                                                        <div className="ratio-bar-container">
                                                            <div
                                                                className="ratio-bar-fill"
                                                                style={{
                                                                    width: `${validRatioCount > 0 ? (group.count / validRatioCount) * 100 : 0}%`,
                                                                    backgroundColor: ['#f56565', '#4299e1', '#48bb78'][index]
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <div className="ratio-count">
                                                            {group.count} 个项目
                                                            ({validRatioCount > 0 ? ((group.count / validRatioCount) * 100).toFixed(1) : 0}%)
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
                                                    {averageStarsPerIssueValid.toLocaleString()} 平均每个问题有星标，
                                                    {averageIssuesPerRepoValid.toLocaleString()} 平均每个项目有问题。
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })()}
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
                                            {issuesData
                                                .slice()
                                                .sort((a, b) => (b.stars || 0) - (a.stars || 0))
                                                // *** Filter by selected languages ***
                                                .filter(repo => selectedLanguages.includes(repo.language))
                                                .slice(0, 100)
                                                .map((repo, index) => (
                                                    <tr key={`issue-table-${repo.repo_id || index}`}>
                                                        <td>{repo.repo_name}</td>
                                                        <td>
                                                            <span
                                                                className="language-indicator"
                                                                style={{ backgroundColor: getLanguageColor(repo.language) }}
                                                            ></span>
                                                            {repo.language || '未知'}
                                                        </td>
                                                        <td>{(repo.stars || 0).toLocaleString()}</td>
                                                        <td>{(repo.open_issues === null || repo.open_issues === undefined) ? 'N/A' : (repo.open_issues).toLocaleString()}</td>
                                                        <td>
                                                            {(repo.open_issues === null || repo.open_issues === undefined || repo.open_issues === 0)
                                                                ? '∞'
                                                                : Math.round((repo.stars || 0) / repo.open_issues).toLocaleString()
                                                            }
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Add message if filter results in no rows */}
                                {issuesData.filter(repo => selectedLanguages.includes(repo.language)).length === 0 && availableLanguages.length > 0 && (
                                    <p className="empty-data-small">当前语言筛选条件下无项目详情。</p>
                                )}
                            </div>
                        </div>
                    </>)}
                </div>
            )}
        </div>
    );
};

export default StarsContributorsIssuesRelation; 