# Github 热门仓库可视化系统

这个项目提供了一个可视化界面，用于展示从Github爬取的热门仓库数据统计信息。

## 项目结构

```
github-viz-app/
├── public/              # 静态资源文件
├── src/                 # 前端源代码
│   ├── components/      # 组件库
│   ├── contexts/        # React context
│   ├── pages/           # 页面组件
│   ├── styles/          # CSS样式
│   └── config/          # 配置文件
├── server/              # 后端API服务
│   ├── api.js           # 数据库API服务
│   └── server.js        # Express服务器
└── index.html           # 包含所有可视化的单页HTML文件
```

## 后端API服务器

后端API服务连接数据库，提供以下数据API：

- `/api/language-distribution`: 编程语言分布统计
- `/api/company-distribution`: 公司分布统计
- `/api/stars-contributors`: 星标与贡献者关系
- `/api/stars-issues`: 星标与问题关系
- `/api/contributor-locations`: 贡献者地区分布
- `/api/activity-heatmap`: 活跃度热图数据
- `/api/language-trends`: 编程语言趋势

## 使用方法

### 部署方式1: 完整React应用

1. 安装依赖
```
cd github-viz-app
npm install
```

2. 启动后端API服务
```
cd github-viz-app
./start-api.sh
```

3. 启动前端开发服务器
```
cd github-viz-app
npm start
```

4. 打开浏览器访问: http://localhost:3000

### 部署方式2: 单HTML文件

无需运行服务器，可以直接打开`index.html`文件在浏览器中查看静态可视化内容。

## 数据来源

数据来自`db/main.py`爬取的Github数据，包括:

- `repo_YYYYMMDD`: 仓库基本信息(星标、贡献者数、问题数等)
- `repo_activity_YYYYMMDD`: 仓库活跃度数据
- `repo_contributors_YYYYMMDD`: 贡献者详细信息

## 数据库配置

数据库连接配置在`server/api.js`中，包括:

```javascript
const dbConfig = {
    host: '192.168.0.15',
    user: 'remote_user',
    password: '88888888',
    database: 'test',
    port: 3306
};
```

如需修改，请更新上述配置信息。 