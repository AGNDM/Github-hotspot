/**
 * API配置文件
 * 定义所有与后端通信的API端点
 */

const API_BASE_URL = 'http://localhost:3001/api';

const API = {
    // 编程语言分布统计
    languageDistribution: `${API_BASE_URL}/language-distribution`,

    // 特定语言的热门仓库
    languageTopRepos: `${API_BASE_URL}/language-top-repos`,

    // 公司分布统计
    companyDistribution: `${API_BASE_URL}/company-distribution`,

    // 星标与贡献者关系
    starsContributors: `${API_BASE_URL}/stars-contributors`,

    // 星标与问题关系
    starsIssues: `${API_BASE_URL}/stars-issues`,

    // 贡献者地区分布
    contributorLocations: `${API_BASE_URL}/contributor-locations`,

    // 活跃度热图数据
    activityHeatmap: `${API_BASE_URL}/activity-heatmap`,

    // 编程语言趋势
    languageTrends: `${API_BASE_URL}/language-trends`,

    // 最受欢迎仓库排行
    topRepositories: `${API_BASE_URL}/top-repositories`,

    // 获取有活动数据的仓库列表
    repositoriesWithActivity: `${API_BASE_URL}/repositories-with-activity`,
};

export default API; 