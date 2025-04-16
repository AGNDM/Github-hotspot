import { useState, useEffect, useMemo } from "react";
import API from "../config/api";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LegendComponent, // Added LegendComponent
} from "echarts/components";
import { LabelLayout, UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";

// Register necessary ECharts components
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LineChart,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
  LegendComponent, // Register LegendComponent
]);

// 根据语言名称生成颜色
const getLanguageColor = (language) => {
  const colorMap = {
    JavaScript: "#f1e05a", // Keep yellow
    TypeScript: "#3178c6", // Official blue
    Python: "#3776ab", // Common blue
    Java: "#b07219", // Keep brown/orange
    Go: "#00add8", // Keep cyan
    "C++": "#f34b7d", // Keep pink
    Ruby: "#cc342d", // Official red
    PHP: "#777bb4", // Official purple
    Rust: "#dea584", // Keep orange
    "C#": "#178600", // Keep green
    Swift: "#f05138", // Official orange
    Kotlin: "#7f52ff", // Primary purple
    // Add more languages and colors as needed
  };

  return colorMap[language] || "#999"; // Default grey
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
        if (!response.ok) throw new Error("获取数据失败");
        const result = await response.json();
        setData(result);
        // 默认选择所有语言，最多5种
        if (Array.isArray(result) && result.length > 0) {
          setSelectedLanguages(result.slice(0, 5).map((lang) => lang.name));
        }
      } catch (err) {
        setError(err.message);
        console.error("获取编程语言趋势出错:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // 提取年份/日期
  const getAllDates = () => {
    const allDates = new Set();
    data.forEach((lang) => {
      if (lang.data && Array.isArray(lang.data)) {
        lang.data.forEach((item) => {
          if (item.date) {
            allDates.add(item.date);
          }
        });
      }
    });
    return Array.from(allDates).sort();
  };

  const years = useMemo(() => getAllDates(), [data]); // Use useMemo for years

  // 切换语言选择
  const toggleLanguage = (language) => {
    if (selectedLanguages.includes(language)) {
      // 至少保留一种语言
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(
          selectedLanguages.filter((lang) => lang !== language)
        );
      }
    } else {
      setSelectedLanguages([...selectedLanguages, language]);
    }
  };

  // Generate ECharts options based on data and selection
  const getChartOption = useMemo(() => {
    if (!data || data.length === 0) {
      return {};
    }

    const filteredData = data.filter((lang) =>
      selectedLanguages.includes(lang.name)
    );

    const seriesList = filteredData.map((lang) => ({
      name: lang.name,
      type: "line",
      smooth: true, // Make lines smoother
      showSymbol: false, // Hide data points by default
      emphasis: {
        // Highlight on hover
        focus: "series",
        itemStyle: {
          borderWidth: 2,
        },
        label: {
          // Show label on hover
          show: true,
          formatter: "{b}: {c}", // Display date and count
        },
      },
      data: lang.data.map((item) => [item.date, item.count]), // Map data to [date, count] format
      itemStyle: {
        // Use language color for the line
        color: getLanguageColor(lang.name),
      },
      lineStyle: {
        // Use language color for the line
        color: getLanguageColor(lang.name),
      },
    }));

    return {
      tooltip: {
        trigger: "axis", // Trigger tooltip on axis hover
        axisPointer: {
          type: "cross", // Show crosshair
        },
      },
      legend: {
        // Add legend to toggle series visibility
        data: selectedLanguages,
        bottom: 10, // Position legend at the bottom
        type: "scroll", // Allow scrolling if too many items
      },
      grid: {
        // Adjust grid padding
        left: "3%",
        right: "4%",
        bottom: "10%", // Increase bottom padding for legend
        containLabel: true,
      },
      xAxis: {
        type: "category", // Dates are categories
        boundaryGap: false, // Line starts from the edge
        data: years, // Use extracted years/dates
      },
      yAxis: {
        type: "value", // Counts are numerical values
        name: "仓库数量", // Y-axis label
        axisLabel: {
          formatter: "{value}", // Format Y-axis labels
        },
      },
      series: seriesList,
      animationDuration: 2000, // Add animation duration
    };
  }, [data, selectedLanguages, years]); // Recalculate when data or selection changes

  if (loading) return <div className="loading-indicator">数据加载中...</div>;
  if (error) return <div className="error-message">加载出错: {error}</div>;
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="error-message">没有找到趋势数据</div>;
  }

  return (
    <div className="language-trends-page">
      <h1 className="page-title">编程语言趋势</h1>

      {/* Language Selection Card - unchanged */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">语言选择</h2>
        </div>
        <div className="card-body">
          <div className="language-toggles">
            {data.map((lang) => (
              <button
                key={lang.name}
                className={`language-toggle ${
                  selectedLanguages.includes(lang.name) ? "active" : ""
                }`}
                onClick={() => toggleLanguage(lang.name)}
                style={{
                  borderColor: getLanguageColor(lang.name),
                  backgroundColor: selectedLanguages.includes(lang.name)
                    ? getLanguageColor(lang.name)
                    : "transparent",
                  color: selectedLanguages.includes(lang.name)
                    ? "#fff"
                    : "inherit",
                }}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">仓库数量趋势</h2>
        </div>
        <div className="card-body">
          {/* Replace mock chart with ReactECharts */}
          <ReactECharts
            echarts={echarts} // Pass the echarts instance
            option={getChartOption} // Pass the generated options
            style={{ height: "400px", width: "100%" }} // Set chart dimensions
            notMerge={true} // Important for dynamic data updates
            lazyUpdate={true} // Optimize updates
            theme={"light"} // Optional: set theme
          />
        </div>
      </div>

      {/* Data Table Card - unchanged */}
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
                  {years.length <= 10
                    ? years.map((year) => <th key={year}>{year}</th>)
                    : years
                        .filter(
                          (_, index) =>
                            index % Math.ceil(years.length / 10) === 0
                        )
                        .map((year) => <th key={year}>{year}</th>)}
                  <th>变化趋势</th>
                </tr>
              </thead>
              <tbody>
                {data.map((lang) => {
                  if (
                    !selectedLanguages.includes(lang.name) ||
                    !Array.isArray(lang.data) ||
                    lang.data.length === 0
                  )
                    return null;

                  // 计算增长率
                  const firstYear = lang.data[0]?.count || 0;
                  const lastYear = lang.data[lang.data.length - 1]?.count || 0;
                  const growthRate =
                    firstYear > 0
                      ? (((lastYear - firstYear) / firstYear) * 100).toFixed(1)
                      : 0;
                  const isGrowing = lastYear > firstYear;

                  return (
                    <tr key={lang.name}>
                      <td className="language-cell">
                        <span
                          className="language-indicator"
                          style={{
                            backgroundColor: getLanguageColor(lang.name),
                          }}
                        ></span>
                        {lang.name}
                      </td>
                      {(years.length <= 10
                        ? years
                        : years.filter(
                            (_, index) =>
                              index % Math.ceil(years.length / 10) === 0
                          )
                      ).map((year) => {
                        const dataItem = lang.data.find((d) => d.date === year);
                        return <td key={year}>{dataItem?.count || 0}</td>;
                      })}
                      <td
                        className={`growth-cell ${
                          isGrowing ? "positive" : "negative"
                        }`}
                      >
                        {isGrowing ? "+" : ""}
                        {growthRate}%
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
