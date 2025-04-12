import React, { useState, useEffect } from 'react';
import API from '../config/api';

function ContributorLocations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [view, setView] = useState('chart'); // 'chart' or 'map'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(API.contributorLocations);
      if (!response.ok) {
        throw new Error('数据获取失败');
      }
      const responseData = await response.json();

      // 处理数据：计算百分比和排名
      const total = responseData.reduce((sum, item) => sum + item.count, 0);
      const processedData = responseData.map((item, index) => ({
        ...item,
        percentage: ((item.count / total) * 100).toFixed(2),
        rank: index + 1
      }));

      setData(processedData);
      setLoading(false);
    } catch (err) {
      console.error('获取贡献者地区数据失败:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // 根据位置生成颜色
  const getLocationColor = (rank) => {
    if (rank <= 3) return '#3b82f6'; // 蓝色
    if (rank <= 10) return '#60a5fa';
    if (rank <= 20) return '#93c5fd';
    return '#bfdbfe';
  };

  // 为地图生成随机坐标
  const getRandomCoordinates = (rank, index) => {
    // 使用排名作为种子来生成坐标
    const seed = rank * (index + 1);
    const radius = 40 + (25 - Math.min(rank, 25)) * 3;
    const angle = (seed % 360) * (Math.PI / 180);

    const centerX = 50;
    const centerY = 50;

    // 排名较高的点更靠近中心
    const distance = 30 - Math.min(rank, 20) * 0.5;

    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;

    return { x, y, radius };
  };

  if (loading) {
    return <div className="loading">加载贡献者地区数据中...</div>;
  }

  if (error) {
    return <div className="error">错误: {error}</div>;
  }

  return (
    <div className="contributor-locations-page">
      <h2>贡献者地区分布</h2>

      <div className="view-toggle">
        <button
          className={`toggle-button ${view === 'chart' ? 'active' : ''}`}
          onClick={() => setView('chart')}
        >
          图表视图
        </button>
        <button
          className={`toggle-button ${view === 'map' ? 'active' : ''}`}
          onClick={() => setView('map')}
        >
          地图视图
        </button>
      </div>

      {view === 'chart' && (
        <div className="locations-chart">
          {data.slice(0, 20).map((location) => (
            <div
              key={location.location}
              className={`location-bar ${hoveredLocation === location.location ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredLocation(location.location)}
              onMouseLeave={() => setHoveredLocation(null)}
            >
              <div className="location-rank">#{location.rank}</div>
              <div className="location-name">{location.location}</div>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{
                    width: `${Math.max(location.percentage, 2)}%`,
                    backgroundColor: getLocationColor(location.rank)
                  }}
                />
                <span className="bar-value">{location.count} 贡献者</span>
              </div>
              <div className="location-percentage">{location.percentage}%</div>
            </div>
          ))}
        </div>
      )}

      {view === 'map' && (
        <div className="map-container">
          <div className="map-visualization">
            {data.slice(0, 30).map((location, index) => {
              const { x, y, radius } = getRandomCoordinates(location.rank, index);
              const isHovered = hoveredLocation === location.location;
              const size = isHovered ? radius * 1.2 : radius;

              return (
                <div
                  key={location.location}
                  className={`map-bubble ${isHovered ? 'hovered' : ''}`}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: getLocationColor(location.rank)
                  }}
                  onMouseEnter={() => setHoveredLocation(location.location)}
                  onMouseLeave={() => setHoveredLocation(null)}
                >
                  <div className="bubble-content">
                    <div className="bubble-name">{location.location}</div>
                    {size > 45 && <div className="bubble-count">{location.count}</div>}
                  </div>

                  {isHovered && (
                    <div className="bubble-tooltip">
                      <div className="tooltip-rank">#{location.rank}</div>
                      <div className="tooltip-name">{location.location}</div>
                      <div className="tooltip-count">{location.count} 贡献者</div>
                      <div className="tooltip-percentage">占比 {location.percentage}%</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="map-legend">
            <div className="legend-title">地区贡献等级</div>
            <div className="legend-colors">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#3b82f6' }}></div>
                <div className="legend-label">前3名</div>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#60a5fa' }}></div>
                <div className="legend-label">4-10名</div>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#93c5fd' }}></div>
                <div className="legend-label">11-20名</div>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#bfdbfe' }}></div>
                <div className="legend-label">其他</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <h3>洞察分析</h3>
      <div className="locations-insights">
        <div className="insight-item">
          <h4 className="insight-title">贡献者多样性</h4>
          <p>
            GitHub开源项目拥有来自{data.length}个不同地区的贡献者，展现了全球开发者社区的多样性和包容性。
            前三大贡献地区占总贡献者的{data.slice(0, 3).reduce((sum, item) => sum + parseFloat(item.percentage), 0).toFixed(2)}%。
          </p>
        </div>

        <div className="insight-item">
          <h4 className="insight-title">主要贡献地区</h4>
          <p>
            {data[0]?.location || '未知地区'}以{data[0]?.count || 0}名贡献者位居首位，
            其次是{data[1]?.location || '未知地区'}（{data[1]?.count || 0}名）和
            {data[2]?.location || '未知地区'}（{data[2]?.count || 0}名）。
            这些地区在开源社区中展现了强大的技术影响力。
          </p>
        </div>
      </div>
    </div>
  );
}

export default ContributorLocations;