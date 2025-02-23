import pandas as pd
import plotly.express as px

# 假设数据已经加载到DataFrame df中
df = pd.read_csv('data(csv)/test1.csv') 
# 示例数据（实际使用中应替换为真实数据）

 
# 示例图表1：柱状图展示各仓库的Star数量
fig1 = px.bar(df, x='repository', y='stars', title='Stars per Repository')
fig1.write_html('stars_per_repository.html')
 
# 示例图表2：散点图展示Star数量与Fork数量的关系
fig2 = px.scatter(df, x='stars', y='forks', size='stars', color='tag', hover_name='repository', title='Stars vs Forks')
fig2.update_traces(marker=dict(size=10, sizemode='area'))  # 调整气泡大小模式为面积
fig2.write_html('stars_vs_forks.html')