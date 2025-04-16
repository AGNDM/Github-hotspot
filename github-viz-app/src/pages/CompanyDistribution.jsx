import { useState, useEffect, useRef } from "react";
import API from "../config/api";
import * as echarts from "echarts/core";
import { PieChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

// Register the required components
echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  PieChart,
  CanvasRenderer,
]);

const CompanyDistribution = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartRef = useRef(null); // Ref for the chart container
  const chartInstance = useRef(null); // Ref for the ECharts instance

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(API.companyDistribution);
        if (!response.ok) throw new Error("获取数据失败");
        const result = await response.json();
        // Sort data by contributor count descending and take top N if needed
        const sortedData = result.sort(
          (a, b) => (b.contributor_count || 0) - (a.contributor_count || 0)
        );
        setData(sortedData);
      } catch (err) {
        setError(err.message);
        console.error("获取公司分布出错:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Effect for initializing and updating the chart
  useEffect(() => {
    if (!loading && data.length > 0 && chartRef.current) {
      // Initialize chart instance if it doesn't exist
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current);
      }

      const totalContributors = data.reduce(
        (sum, item) => sum + (item.contributor_count || 0),
        0
      );
      const companies = data
        .map((item) => ({
          name: item.company || "Unknown", // Ensure name is not null/undefined
          value: item.contributor_count || 0,
        }))
        .filter((item) => item.value > 0); // Filter out companies with 0 contributors for the chart

      // Limit the number of companies shown directly in the pie chart for clarity
      const topN = 10;
      const chartData = companies.slice(0, topN);
      const otherCount = companies
        .slice(topN)
        .reduce((sum, item) => sum + item.value, 0);
      if (otherCount > 0) {
        chartData.push({ name: "Others", value: otherCount });
      }

      const option = {
        title: {
          text: "Top Company Contributions",
          subtext: `Total Contributors: ${totalContributors.toLocaleString()}`,
          left: "center",
        },
        tooltip: {
          trigger: "item",
          formatter: "{a} <br/>{b}: {c} ({d}%)",
        },
        legend: {
          orient: "vertical",
          left: "left",
          data: chartData.map((item) => item.name), // Use names from chartData for legend
        },
        series: [
          {
            name: "Contributors",
            type: "pie",
            radius: ["40%", "70%"], // Make it a donut chart
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: "#fff",
              borderWidth: 2,
            },
            label: {
              show: false, // Keep labels off the pie segments initially
              position: "center",
            },
            emphasis: {
              // Style on hover
              label: {
                show: true,
                fontSize: "20",
                fontWeight: "bold",
              },
            },
            labelLine: {
              show: false,
            },
            data: chartData, // Use the processed chart data
          },
        ],
      };

      chartInstance.current.setOption(option);

      // Add resize listener
      const handleResize = () => {
        chartInstance.current?.resize();
      };
      window.addEventListener("resize", handleResize);

      // Cleanup function
      return () => {
        window.removeEventListener("resize", handleResize);
        // Dispose chart instance only if component is fully unmounting
        // chartInstance.current?.dispose(); // Be careful with dispose on re-renders
      };
    }
  }, [loading, data]); // Re-run effect if loading state or data changes

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  if (loading) return <div className="loading-indicator">数据加载中...</div>;
  if (error) return <div className="error-message">加载出错: {error}</div>;

  // 如果数据为空或不是期望的格式
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div className="empty-data">没有公司分布数据</div>;
  }

  // 处理数据并计算统计值
  const totalContributors = data.reduce(
    (sum, item) => sum + (item.contributor_count || 0),
    0
  );
  const companies = data.map((item) => ({
    name: item.company,
    count: item.contributor_count || 0,
    percentage: (
      ((item.contributor_count || 0) / totalContributors) *
      100
    ).toFixed(1),
  }));

  // 基于公司名称简单分类领域 (实际项目中应该由API提供)
  const domainMapping = {
    Google: "企业",
    Microsoft: "企业",
    "Red Hat": "企业",
    Facebook: "企业",
    IBM: "企业",
    Amazon: "企业",
    Apple: "企业",
    Oracle: "企业",
    GitHub: "企业",
    University: "学术",
    MIT: "学术",
    Stanford: "学术",
    Foundation: "非营利组织",
    Institute: "非营利组织",
  };

  // 生成领域数据
  const domainCounts = {
    企业: 0,
    学术: 0,
    非营利组织: 0,
    独立开发者: 0,
  };

  companies.forEach((company) => {
    let assigned = false;
    Object.entries(domainMapping).forEach(([keyword, domain]) => {
      if (company.name.includes(keyword)) {
        domainCounts[domain] += company.count;
        assigned = true;
      }
    });
    if (!assigned) {
      domainCounts["独立开发者"] += company.count;
    }
  });

  const domains = Object.entries(domainCounts).map(([name, count]) => ({
    name,
    count,
    percentage: ((count / totalContributors) * 100).toFixed(1),
  }));

  // 生成渐变色
  const getCompanyColor = (index, total) => {
    const hue = 210; // 蓝色调
    const saturation = "75%";
    const minLightness = 35;
    const maxLightness = 65;

    // 根据索引计算亮度值，使颜色由深到浅
    const lightness =
      maxLightness -
      (index / Math.min(total - 1, 12)) * (maxLightness - minLightness);

    return `hsl(${hue}, ${saturation}, ${lightness}%)`;
  };

  // 对于领域图表使用不同颜色
  const getDomainColor = (index) => {
    const colors = ["#4299e1", "#48bb78", "#ed8936", "#f56565"];
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
            <div className="stat-description">
              {companies[0].count.toLocaleString()} 名贡献者
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          {/* Title is now handled by ECharts option */}
          {/* <h2 className="card-title">公司分布图</h2> */}
        </div>
        <div className="card-body">
          {/* ECharts container */}
          <div ref={chartRef} style={{ width: "100%", height: "400px" }}></div>
          {/* Remove the old mock chart and legend */}
          {/*
                    <div className="company-chart">
                        <div className="chart-container">
                            ... mock pie chart ...
                        </div>
                        <div className="chart-legend">
                            ... mock legend ...
                        </div>
                    </div>
                     */}
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
                      backgroundColor: getDomainColor(index),
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDistribution;
