import React, { useState, useEffect } from 'react';

function ContributorLocations() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  // 模拟数据加载（如果需要）
  useEffect(() => {
    // 这里可以模拟数据加载，例如从一个静态数组设置数据
    setData([
      { location: 'Location 1', count: 100 },
      { location: 'Location 2', count: 80 },
      { location: 'Location 3', count: 60 },
      // 可以根据需要添加更多数据
    ]);
  }, []);

  if (error) {
    return <div className="error">错误: {error}</div>;
  }

  return (
    <div className="contributor-locations-page">
      <h2>贡献者地区分布</h2>

      {/* 嵌入外部 HTML 文件 */}
      <iframe
        src="/pic8_developers_heatmap.html" // 替换为实际的 HTML 文件路径
        width="100%"
        height="400px" // 根据需要调整高度
        frameBorder="0"
        allowFullScreen
      />

      <h3>洞察分析</h3>
      <div className="locations-insights">
        <div className="insight-item">
          <h4 className="insight-title">贡献者多样性</h4>
          <p>
            GitHub开源项目拥有来自{data.length}个不同地区的贡献者，展现了全球开发者社区的多样性和包容性。
            前三大贡献地区占总贡献者的{data.slice(0, 3).reduce((sum, item) => sum + item.count, 0) / data.reduce((sum, item) => sum + item.count, 0) * 100}.00%。
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