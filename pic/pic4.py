import pandas as pd
import plotly.express as px

# Read the CSV file
df = pd.read_csv('data(csv)/test3.csv')

# 选择要显示的项目
selected_project = 'Project A'  
df_filtered = df[df['project'] == selected_project]

# 创建基础图表
fig = px.line(df_filtered, x='date', y='stars', 
              title=f'Repository Stars Over Time - {selected_project}',
              markers=True)

# 更新布局
fig.update_layout(
    xaxis_title="Date",
    yaxis_title="Number of Stars",
    hovermode='x unified',
    title_x=0.5
)

fig.write_html("htmlfigure/pic4_stars_over_time.html")
fig.show()