/**
 * Github热门仓库数据API服务器
 */

const express = require('express');
const cors = require('cors');
const api = require('./api');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3001;

// 启用CORS和JSON解析
app.use(cors());
app.use(express.json());

// 测试API
app.get('/api/test', async (req, res) => {
    const connected = await api.testConnection();
    res.json({
        status: connected ? 'ok' : 'error',
        message: connected ? '数据库连接成功' : '数据库连接失败'
    });
});

// 获取编程语言分布
app.get('/api/language-distribution', async (req, res) => {
    try {
        const data = await api.getLanguageDistribution();
        res.json(data);
    } catch (error) {
        console.error('API错误:', error);
        res.status(500).json({ error: '获取语言分布数据失败' });
    }
});

// 获取公司分布
app.get('/api/company-distribution', async (req, res) => {
    try {
        const data = await api.getCompanyDistribution();
        res.json(data);
    } catch (error) {
        console.error('API错误:', error);
        res.status(500).json({ error: '获取公司分布数据失败' });
    }
});

// 获取星标与贡献者关系
app.get('/api/stars-contributors', async (req, res) => {
    try {
        const data = await api.getStarsContributorsRelation();
        res.json(data);
    } catch (error) {
        console.error('API错误:', error);
        res.status(500).json({ error: '获取星标与贡献者关系数据失败' });
    }
});

// 获取星标与问题关系
app.get('/api/stars-issues', async (req, res) => {
    try {
        const data = await api.getStarsIssuesRelation();
        res.json(data);
    } catch (error) {
        console.error('API错误:', error);
        res.status(500).json({ error: '获取星标与问题关系数据失败' });
    }
});

// 获取贡献者地区分布
app.get('/api/contributor-locations', async (req, res) => {
    try {
        const data = await api.getContributorLocations();
        res.json(data);
    } catch (error) {
        console.error('API错误:', error);
        res.status(500).json({ error: '获取贡献者地区分布数据失败' });
    }
});

// 获取有活动数据的仓库列表
app.get('/api/repositories-with-activity', async (req, res) => {
    try {
        const data = await api.getRepositoriesWithActivity();
        res.json(data);
    } catch (error) {
        console.error('API错误:', error);
        res.status(500).json({ error: '获取含活动数据的仓库列表失败' });
    }
});

// 获取活跃度热图数据 (修改为处理repoName查询参数)
app.get('/api/activity-heatmap', async (req, res) => {
    try {
        const repoName = req.query.repoName || null; // 从查询参数获取仓库名
        console.log(`收到活跃度热图请求，仓库: ${repoName || '所有仓库'}`);
        const data = await api.getActivityHeatmap(repoName); // 将仓库名传递给API函数
        res.json(data);
    } catch (error) {
        console.error('API错误:', error);
        res.status(500).json({ error: '获取活跃度热图数据失败' });
    }
});

// 获取编程语言趋势
app.get('/api/language-trends', async (req, res) => {
    try {
        const data = await api.getLanguageTrends();
        res.json(data);
    } catch (error) {
        console.error('API错误:', error);
        res.status(500).json({ error: '获取编程语言趋势数据失败' });
    }
});

// 获取特定语言的热门仓库
app.get('/api/language-top-repos', async (req, res) => {
    try {
        const language = req.query.language;
        if (!language) {
            return res.status(400).json({ error: '需要指定language参数' });
        }

        const data = await api.getLanguageTopRepos(language);
        res.json(data);
    } catch (error) {
        console.error('API错误:', error);
        res.status(500).json({ error: '获取语言热门仓库失败' });
    }
});

// 获取最受欢迎仓库
app.get('/api/top-repositories', async (req, res) => {
    try {
        const data = await api.getTopRepositories();
        res.json(data);
    } catch (error) {
        console.error('API错误:', error);
        res.status(500).json({ error: '获取最受欢迎仓库数据失败' });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`API服务器运行在 http://localhost:${PORT}`);
    console.log('正在尝试连接数据库...');
    api.testConnection().then(connected => {
        if (connected) {
            console.log('数据库连接成功，API服务已就绪');
        } else {
            console.log('警告: 数据库连接失败，请检查配置');
        }
    });
});

module.exports = app; 