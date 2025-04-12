import { useState, useEffect } from 'react';
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
    Kotlin: '#F18E33'
  };

  return colorMap[language] || '#999';
};

const LanguageTrends = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLanguages, setSelectedLanguages] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(API.languageTrends);
        if (!response.ok) throw new Error('获取数据失败');
        const result = await response.json();
        setData(result);
        // 默认选择所有语言，最多5种
        if (Array.isArray(result) && result.length > 0) {
          setSelectedLanguages(result.slice(0, 5).map(lang => lang.name));
        }
      } catch (err) {
        setError(err.message);
        console.error('获取编程语言趋势出错:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div className="loading-indicator">数据加载中...</div>;
  if (error) return <div className="error-message">加载出错: {error}</div>;
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="error-message">没有找到趋势数据</div>;
  }

  // 切换语言选择
  const toggleLanguage = (language) => {
    if (selectedLanguages.includes(language)) {
      // 至少保留一种语言
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter(lang => lang !== language));
      }
    } else {
      setSelectedLanguages([...selectedLanguages, language]);
    }
  };

  // 提取年份/日期
  const getAllDates = () => {
    const allDates = new Set();
    data.forEach(lang => {
      if (lang.data && Array.isArray(lang.data)) {
        lang.data.forEach(item => {
          if (item.date) {
            allDates.add(item.date);
          }
        });
      }
    });
    return Array.from(allDates).sort();
  };

  const years = getAllDates();

  // 获取最大值，用于计算图表的高度比例
  const getMaxValue = () => {
    let max = 0;
    data.forEach(lang => {
      if (selectedLanguages.includes(lang.name) && Array.isArray(lang.data)) {
        lang.data.forEach(item => {
          if (item.count > max) max = item.count;
        });
      }
    });
    return max || 1000; // 默认最大值
  };

  const maxValue = getMaxValue();

  return (
    <div className="language-trends-page">
      <h1 className="page-title">编程语言趋势</h1>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">语言选择</h2>
        </div>
        <div className="card-body">
          <div className="language-toggles">
            {data.map(lang => (
              <button
                key={lang.name}
                className={`language-toggle ${selectedLanguages.includes(lang.name) ? 'active' : ''}`}
                onClick={() => toggleLanguage(lang.name)}
                style={{
                  borderColor: getLanguageColor(lang.name),
                  backgroundColor: selectedLanguages.includes(lang.name)
                    ? getLanguageColor(lang.name)
                    : 'transparent',
                  color: selectedLanguages.includes(lang.name) ? '#fff' : 'inherit'
                }}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">仓库数量趋势</h2>
        </div>
        <div className="card-body">
          <div className="trend-chart-container">
            {/* 在实际项目中使用Recharts等图表库 */}
            <div className="mock-trend-chart">
              <div className="chart-y-axis">
                <div className="axis-label">{maxValue}</div>
                <div className="axis-label">{Math.round(maxValue * 0.75)}</div>
                <div className="axis-label">{Math.round(maxValue * 0.5)}</div>
                <div className="axis-label">{Math.round(maxValue * 0.25)}</div>
                <div className="axis-label">0</div>
              </div>

              <div className="chart-content">
                <div className="chart-grid">
                  {[0.25, 0.5, 0.75, 1].map((level) => (
                    <div key={level} className="grid-line" style={{ bottom: `${level * 100}%` }} />
                  ))}
                </div>

                {data.map(lang => {
                  if (!selectedLanguages.includes(lang.name) || !Array.isArray(lang.data) || lang.data.length === 0) return null;

                  const points = lang.data.map((item, index) => {
                    const x = `${(index / (lang.data.length - 1)) * 100}%`;
                    const y = `${100 - (item.count / maxValue) * 100}%`;
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <div
                      key={lang.name}
                      className="chart-line"
                      style={{ color: getLanguageColor(lang.name) }}
                    >
                      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polyline
                          points={points}
                          strokeWidth="2"
                          stroke={getLanguageColor(lang.name)}
                          fill="none"
                        />
                      </svg>

                      {lang.data.map((item, index) => (
                        <div
                          key={index}
                          className="data-point"
                          style={{
                            left: `${(index / (lang.data.length - 1)) * 100}%`,
                            bottom: `${(item.count / maxValue) * 100}%`,
                            backgroundColor: getLanguageColor(lang.name)
                          }}
                          title={`${lang.name} (${item.date}): ${item.count} 个仓库`}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>

              <div className="chart-x-axis">
                {years.length <= 10 ?
                  years.map(year => (
                    <div key={year} className="axis-label">{year}</div>
                  )) :
                  years.filter((_, index) => index % Math.ceil(years.length / 10) === 0).map(year => (
                    <div key={year} className="axis-label">{year}</div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">趋势数据表格</h2>
        </div>
        <div className="card-body">
          <div className="trend-table">
            <table>
              <thead>
                <tr>
                  <th>语言</th>
                  {years.length <= 10 ?
                    years.map(year => (
                      <th key={year}>{year}</th>
                    )) :
                    years.filter((_, index) => index % Math.ceil(years.length / 10) === 0).map(year => (
                      <th key={year}>{year}</th>
                    ))
                  }
                  <th>变化趋势</th>
                </tr>
              </thead>
              <tbody>
                {data.map(lang => {
                  if (!selectedLanguages.includes(lang.name) || !Array.isArray(lang.data) || lang.data.length === 0) return null;

                  // 计算增长率
                  const firstYear = lang.data[0]?.count || 0;
                  const lastYear = lang.data[lang.data.length - 1]?.count || 0;
                  const growthRate = firstYear > 0 ? ((lastYear - firstYear) / firstYear * 100).toFixed(1) : 0;
                  const isGrowing = lastYear > firstYear;

                  return (
                    <tr key={lang.name}>
                      <td className="language-cell">
                        <span
                          className="language-indicator"
                          style={{ backgroundColor: getLanguageColor(lang.name) }}
                        ></span>
                        {lang.name}
                      </td>
                      {(years.length <= 10 ? years : years.filter((_, index) => index % Math.ceil(years.length / 10) === 0)).map(year => {
                        const dataItem = lang.data.find(d => d.date === year);
                        return <td key={year}>{dataItem?.count || 0}</td>;
                      })}
                      <td className={`growth-cell ${isGrowing ? 'positive' : 'negative'}`}>
                        {isGrowing ? '+' : ''}{growthRate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageTrends; 