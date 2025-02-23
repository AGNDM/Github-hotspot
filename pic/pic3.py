import pandas as pd
import plotly.express as px
from plotly.subplots import make_subplots
import plotly.graph_objects as go

# 读取数据
df = pd.read_csv('data(csv)/test1.csv')

# 创建2D散点图
scatter_stars_contrib = px.scatter(df, x='stars', y='contributors', trendline="ols")
scatter_stars_issues = px.scatter(df, x='stars', y='issues', trendline="ols")
scatter_contrib_issues = px.scatter(df, x='contributors', y='issues', trendline="ols")

# 创建子图布局
fig = make_subplots(
    rows=3, cols=2,
    specs=[[{"type": "scene", "rowspan": 3, "colspan": 1}, {"type": "xy"}],
           [None, {"type": "xy"}],
           [None, {"type": "xy"}]],
    subplot_titles=('3D Visualization', 'Stars vs Contributors', 
                   'Stars vs Issues', 'Contributors vs Issues')
)

# 添加3D散点图
scatter3d = go.Scatter3d(
    x=df['stars'],
    y=df['contributors'],
    z=df['issues'],
    mode='markers',
    name='3D View',  
    marker=dict(
        size=4,
        color='blue',
        opacity=0.4
    )
)
fig.add_trace(scatter3d, row=1, col=1)

# 添加2D散点图
fig.add_trace(
    scatter_stars_contrib.data[0].update(
        marker=dict(size=4, color='blue', opacity=0.7),
    ),
    row=1, col=2
)
fig.add_trace(scatter_stars_contrib.data[1], row=1, col=2)  # 添加趋势线

fig.add_trace(
    scatter_stars_issues.data[0].update(
        marker=dict(size=4, color='blue', opacity=0.7),
    ),
    row=2, col=2
)
fig.add_trace(scatter_stars_issues.data[1], row=2, col=2)  # 添加趋势线

fig.add_trace(
    scatter_contrib_issues.data[0].update(
        marker=dict(size=4, color='blue', opacity=0.7),
    ),
    row=3, col=2
)
fig.add_trace(scatter_contrib_issues.data[1], row=3, col=2)  # 添加趋势线

# 更新布局
fig.update_layout(
    title='GitHub Repository Metrics Analysis',
    scene = dict(
        xaxis_title='Stars',
        yaxis_title='Contributors',
        zaxis_title='Issues'
    ),
    width=1500,  
    height=800,
    showlegend=False
)

# 更新2D子图的轴标签
fig.update_xaxes(title_text="Stars", row=1, col=2)
fig.update_xaxes(title_text="Stars", row=2, col=2)
fig.update_xaxes(title_text="Contributors", row=3, col=2)
fig.update_yaxes(title_text="Contributors", row=1, col=2)
fig.update_yaxes(title_text="Issues", row=2, col=2)
fig.update_yaxes(title_text="Issues", row=3, col=2)

fig.write_html('pic/pic3.html')
# 显示图表
fig.show()
