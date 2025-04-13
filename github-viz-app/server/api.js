/**
 * API数据处理模块
 * 负责处理数据库连接和数据查询
 */

const mysql = require('mysql2/promise');
const moment = require('moment');

// 数据库连接配置
const dbConfig = {
    host: '192.168.0.15',
    user: 'remote_user',
    password: '88888888',
    database: 'test',
    port: 3306
};

// 创建数据库连接池
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 测试数据库连接
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('数据库连接成功!');
        connection.release();
        return true;
    } catch (error) {
        console.error('数据库连接失败:', error);
        return false;
    }
}

// 获取可用的表名
async function getAvailableTables() {
    try {
        // 获取所有表
        const [rows] = await pool.query(`SHOW TABLES`);
        const allTables = rows.map(row => Object.values(row)[0]);

        // 筛选出各类型的表
        const repoTables = allTables.filter(t => t.startsWith('repo_') && !t.includes('contributors') && !t.includes('activity'));
        const contributorTables = allTables.filter(t => t.includes('contributors'));
        const activityTables = allTables.filter(t => t.includes('activity'));

        // 获取最新日期
        const getDateFromTable = (table, prefix) => {
            const dateStr = table.replace(prefix, '');
            return dateStr;
        };

        // 按日期排序并获取最新的
        repoTables.sort((a, b) => getDateFromTable(b, 'repo_') - getDateFromTable(a, 'repo_'));
        contributorTables.sort((a, b) => getDateFromTable(b, 'repo_contributors_') - getDateFromTable(a, 'repo_contributors_'));
        activityTables.sort((a, b) => getDateFromTable(b, 'repo_activity_') - getDateFromTable(a, 'repo_activity_'));

        console.log('可用的仓库表:', repoTables);
        console.log('可用的贡献者表:', contributorTables);
        console.log('可用的活动表:', activityTables);

        return {
            repoTable: repoTables.length > 0 ? repoTables[0] : null,
            contributorTable: contributorTables.length > 0 ? contributorTables[0] : null,
            activityTable: activityTables.length > 0 ? activityTables[0] : null
        };
    } catch (error) {
        console.error('获取可用表失败:', error);
        return { repoTable: null, contributorTable: null, activityTable: null };
    }
}

// 获取编程语言分布
async function getLanguageDistribution() {
    try {
        const { repoTable } = await getAvailableTables();
        if (!repoTable) return [];

        console.log(`正在查询编程语言分布，使用表: ${repoTable}`);
        const [rows] = await pool.query(`
            SELECT 
                language, 
                COUNT(*) as count,
                SUM(stars) as total_stars,
                SUM(forks) as total_forks
            FROM ${repoTable}
            WHERE language IS NOT NULL AND language != ''
            GROUP BY language
            ORDER BY count DESC
            LIMIT 15
        `);

        return rows;
    } catch (error) {
        console.error('获取语言分布数据失败:', error);
        return [];
    }
}

// 获取公司分布
async function getCompanyDistribution() {
    try {
        const { contributorTable } = await getAvailableTables();
        if (!contributorTable) return [];

        console.log(`正在查询公司分布，使用表: ${contributorTable}`);
        const [rows] = await pool.query(`
            SELECT 
                company, 
                COUNT(*) as contributor_count,
                COUNT(DISTINCT repo_id) as repo_count
            FROM ${contributorTable}
            WHERE company IS NOT NULL AND company != ''
            GROUP BY company
            ORDER BY contributor_count DESC
            LIMIT 15
        `);

        return rows;
    } catch (error) {
        console.error('获取公司分布数据失败:', error);
        return [];
    }
}

// 获取星标和贡献者关系
async function getStarsContributorsRelation() {
    try {
        const { repoTable } = await getAvailableTables();
        if (!repoTable) return [];

        console.log(`正在查询星标和贡献者关系，使用表: ${repoTable}`);
        console.log(`注意: 不再限制结果数量，可能返回大量数据`);

        // 使用计数查询来了解数据量
        const [countResult] = await pool.query(`
            SELECT COUNT(*) as total 
            FROM ${repoTable}
            WHERE contributors > 0
        `);

        const totalCount = countResult[0].total;
        console.log(`数据库中共有 ${totalCount} 条符合条件的记录`);

        // 对大量数据进行警告
        if (totalCount > 1000) {
            console.warn(`警告：数据量较大 (${totalCount} 条)，可能会影响性能`);
        }

        // 执行查询但不限制数量
        const [rows] = await pool.query(`
            SELECT 
                name as repo_name,
                stars,
                contributors as contributors_count,
                forks,
                open_issues,
                language
            FROM ${repoTable}
            WHERE contributors > 0  
            ORDER BY stars DESC
        `);

        console.log(`查询完成，共获取 ${rows.length} 条记录`);
        return rows;
    } catch (error) {
        console.error('获取星标与贡献者关系数据失败:', error);
        return [];
    }
}

// 获取星标和问题关系
async function getStarsIssuesRelation() {
    try {
        const { repoTable } = await getAvailableTables();
        if (!repoTable) return [];

        console.log(`正在查询星标和问题关系，使用表: ${repoTable}`);
        console.log(`注意: 不再限制结果数量，可能返回大量数据`);

        // 使用计数查询来了解数据量
        const [countResult] = await pool.query(`
            SELECT COUNT(*) as total 
            FROM ${repoTable}
            WHERE open_issues > 0
        `);

        const totalCount = countResult[0].total;
        console.log(`数据库中共有 ${totalCount} 条符合条件的记录`);

        // 对大量数据进行警告
        if (totalCount > 1000) {
            console.warn(`警告：数据量较大 (${totalCount} 条)，可能会影响性能`);
        }

        // 执行查询但不限制数量
        const [rows] = await pool.query(`
            SELECT 
                name as repo_name,
                stars,
                open_issues,
                language
            FROM ${repoTable}
            WHERE open_issues > 0
            ORDER BY stars DESC
        `);

        console.log(`查询完成，共获取 ${rows.length} 条记录`);
        return rows;
    } catch (error) {
        console.error('获取星标与问题关系数据失败:', error);
        return [];
    }
}

// 获取贡献者地区分布
async function getContributorLocations() {
    try {
        const { contributorTable } = await getAvailableTables();
        if (!contributorTable) return [];

        console.log(`正在查询贡献者地区分布，使用表: ${contributorTable}`);
        const [rows] = await pool.query(`
            SELECT 
                location,
                COUNT(*) as contributor_count
            FROM ${contributorTable}
            WHERE location IS NOT NULL AND location != ''
            GROUP BY location
            ORDER BY contributor_count DESC
            LIMIT 30
        `);

        return rows;
    } catch (error) {
        console.error('获取贡献者地区分布数据失败:', error);
        return [];
    }
}

// 获取有活动数据的仓库列表
async function getRepositoriesWithActivity() {
    let connection;
    try {
        const { activityTable } = await getAvailableTables();
        if (!activityTable) {
            console.warn('未找到活动数据表，无法获取仓库列表');
            return [];
        }

        console.log(`正在从表 ${activityTable} 查询有活动数据的仓库列表`);
        connection = await pool.getConnection();

        const [rows] = await connection.query(`
            SELECT DISTINCT repo_name, repo_id 
            FROM ${activityTable} 
            ORDER BY repo_name ASC
        `);

        connection.release();

        console.log(`查询到 ${rows.length} 个有活动数据的仓库`);
        return rows;
    } catch (error) {
        console.error('获取有活动数据的仓库列表失败:', error);
        if (connection) connection.release();
        return [];
    }
}

// 获取活跃度热图数据 (修改为可按仓库过滤)
async function getActivityHeatmap(repoName = null) { // 添加 repoName 参数
    let connection;
    try {
        const { activityTable } = await getAvailableTables();
        if (!activityTable) {
            console.warn('未找到活动数据表，返回空数据');
            return [];
        }

        let query = `SELECT day_commits FROM ${activityTable}`;
        const params = [];

        if (repoName) {
            console.log(`正在查询仓库 ${repoName} 的活跃度热图数据，使用表: ${activityTable}`);
            query += ` WHERE repo_name = ?`;
            params.push(repoName);
        } else {
            console.log(`正在查询所有仓库的聚合活跃度热图数据，使用表: ${activityTable}`);
            // 不需要 WHERE 子句，查询所有
        }

        connection = await pool.getConnection();

        // 查询 day_commits JSON 数据
        const [rows] = await connection.query(query, params);

        connection.release(); // 释放连接

        if (!rows || rows.length === 0) {
            console.warn(`在活动表 ${activityTable} 中未找到仓库 ${repoName || '(所有仓库)'} 的数据`);
            return [];
        }

        // 处理数据：将所有周的每日提交合并
        let allDailyCommits = [];
        rows.forEach(row => {
            try {
                const dailyData = JSON.parse(row.day_commits);
                if (Array.isArray(dailyData) && dailyData.length === 7) {
                    allDailyCommits.push(...dailyData);
                }
            } catch (parseError) {
                console.error(`解析 day_commits JSON 失败: ${row.day_commits}`, parseError);
            }
        });

        console.log(`从数据库共解析出 ${allDailyCommits.length} 天的提交数据（针对 ${repoName || '所有仓库'}）`);

        // 生成过去 365 天的日期
        const daysInYear = 365;
        const heatmapData = [];
        const endDate = moment(); // 今天

        for (let i = 0; i < daysInYear; i++) {
            const date = moment(endDate).subtract(daysInYear - 1 - i, 'days');
            heatmapData.push({
                date: date.format('YYYY-MM-DD'),
                count: 0, // 初始化为 0
                weekday: date.day()
            });
        }

        // 将解析出的 commit 数据映射到最近 365 天 (从后往前填充)
        const startIndex = Math.max(0, allDailyCommits.length - daysInYear);
        const relevantCommits = allDailyCommits.slice(startIndex);

        relevantCommits.forEach((count, index) => {
            if (heatmapData[index]) {
                heatmapData[index].count = count;
            }
        });

        console.log(`成功生成 ${heatmapData.length} 天的热图数据（针对 ${repoName || '所有仓库'}）`);
        return heatmapData;

    } catch (error) {
        console.error(`获取活跃度热图数据失败（仓库: ${repoName || '所有仓库'}）:`, error);
        if (connection) connection.release(); // 确保释放连接
        return []; // 返回空数组表示失败，前端将使用模拟数据
    }
}

// 获取编程语言趋势
async function getLanguageTrends() {
    try {
        // 获取所有可用的仓库表
        const [tablesResult] = await pool.query(`SHOW TABLES LIKE 'repo_%'`);
        const repoTables = tablesResult
            .map(row => Object.values(row)[0])
            .filter(table => !table.includes('contributors') && !table.includes('activity'))
            .sort();

        if (repoTables.length === 0) return [];

        console.log(`找到${repoTables.length}个仓库表用于趋势分析:`, repoTables);

        // 从多个表获取数据以分析趋势
        const allData = [];

        for (const table of repoTables) {
            // 从表名中提取日期
            const dateMatch = table.match(/repo_(\d+)/);
            if (!dateMatch) continue;

            const dateStr = dateMatch[1];
            // 格式化日期: YYYYMMDD -> YYYY-MM-DD
            const formattedDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;

            const [rows] = await pool.query(`
                SELECT 
                    language,
                    COUNT(*) as repo_count
                FROM ${table}
                WHERE language IS NOT NULL AND language != ''
                GROUP BY language
            `);

            rows.forEach(row => {
                allData.push({
                    language: row.language,
                    date: formattedDate,
                    count: row.repo_count
                });
            });
        }

        // 按语言分组
        const languages = {};
        allData.forEach(item => {
            if (!languages[item.language]) {
                languages[item.language] = [];
            }
            languages[item.language].push({
                date: item.date,
                count: item.count
            });
        });

        // 转换为前端需要的格式
        const result = Object.keys(languages).map(language => ({
            name: language,
            data: languages[language].sort((a, b) => new Date(a.date) - new Date(b.date))
        }));

        return result;
    } catch (error) {
        console.error('获取编程语言趋势数据失败:', error);
        return [];
    }
}

// 辅助函数：为编程语言生成颜色
function getLanguageColor(language) {
    const colorMap = {
        'JavaScript': '#f1e05a',
        'TypeScript': '#2b7489',
        'Python': '#3572A5',
        'Java': '#b07219',
        'Go': '#00ADD8',
        'C++': '#f34b7d',
        'C': '#555555',
        'PHP': '#4F5D95',
        'Ruby': '#701516',
        'Rust': '#dea584',
        'Scala': '#c22d40',
        'Swift': '#ffac45',
        'Kotlin': '#F18E33',
        'Dart': '#00B4AB',
        'Objective-C': '#438eff'
    };

    return colorMap[language] || '#ededed';
}

// 获取特定语言的热门仓库
async function getLanguageTopRepos(language, limit = 6) {
    try {
        const { repoTable } = await getAvailableTables();
        if (!repoTable) return [];

        console.log(`正在查询${language}语言的热门仓库，使用表: ${repoTable}`);
        const [rows] = await pool.query(`
            SELECT 
                name as repo_name,
                full_name,
                stars,
                forks,
                language,
                description
            FROM ${repoTable}
            WHERE language = ?
            ORDER BY stars DESC
            LIMIT ?
        `, [language, limit]);

        return rows;
    } catch (error) {
        console.error(`获取${language}语言热门仓库失败:`, error);
        return [];
    }
}

/**
 * 获取最受欢迎仓库排行
 * @returns {Promise<Array>} 排名靠前的仓库列表
 */
async function getTopRepositories() {
    try {
        const { repoTable } = await getAvailableTables();
        if (!repoTable) return [];

        // 获取一个月前的日期格式化为YYYYMMDD
        const oneMonthAgo = moment().subtract(1, 'month').format('YYYYMMDD');
        //const oneMonthAgo = "20250323";

        // 尝试获取一个月前的仓库表
        const previousTableName = `repo_20250322`;
        let previousTableExists = false;

        try {
            const [checkTable] = await pool.query(`SHOW TABLES LIKE '${previousTableName}'`);
            previousTableExists = checkTable.length > 0;
        } catch (err) {
            console.log(`一个月前的表 ${previousTableName} 不存在，无法计算增长率`);
        }

        console.log(`正在查询最受欢迎仓库，使用表: ${repoTable}`);
        let query = `
            SELECT 
                id as repo_id,
                name,
                full_name,
                owner_login as owner,
                description,
                language,
                stars,
                forks,
                url
            FROM ${repoTable}
            ORDER BY stars DESC
            LIMIT 1500
        `;

        const [rows] = await pool.query(query);

        // 如果有一个月前的表，获取之前的数据来计算增长率
        if (previousTableExists) {
            console.log(`获取一个月前的数据来计算增长率，使用表: ${previousTableName}`);

            for (const repo of rows) {
                try {
                    const [previousData] = await pool.query(`
                        SELECT stars
                        FROM ${previousTableName}
                        WHERE name = ?
                    `, [repo.name]);

                    if (previousData.length > 0) {
                        repo.stars_month_ago = previousData[0].stars;
                    }
                } catch (err) {
                    console.error(`获取 ${repo.name} 的历史数据失败:`, err);
                }
            }
        }

        return rows;
    } catch (error) {
        console.error('获取最受欢迎仓库数据失败:', error);
        return [];
    }
}

module.exports = {
    testConnection,
    getAvailableTables,
    getLanguageDistribution,
    getCompanyDistribution,
    getStarsContributorsRelation,
    getStarsIssuesRelation,
    getContributorLocations,
    getActivityHeatmap,
    getLanguageTrends,
    getLanguageColor,
    getLanguageTopRepos,
    getTopRepositories,
    getRepositoriesWithActivity
}; 