import pandas as pd
import plotly.express as px
import numpy as np
 
# 假设你的DataFrame已经加载
df = pd.read_csv('data(csv)/test1.csv')
 
# 生成一个日期范围，例如从2020-01-01到2023-12-31
date_range = pd.date_range(start='2020-01-01', end='2023-12-31')
 
# 为DataFrame添加一个新列'timestamp'，并从日期范围中随机选择日期
df['timestamp'] = np.random.choice(date_range, size=len(df))
 
# 显示前几行以验证时间戳已添加
#print(df.head())
fig = px.bar(df,
             x='timestamp',  # 横轴：时间戳（这里按月展示）
             y='contributors',  # 纵轴：贡献者数量
             color='repository',  # 堆叠部分：不同仓库的贡献者数量，通过颜色区分
             barmode='stack',  # 设置为堆叠模式
             title='各仓库贡献者数量随时间的变化',
             labels={
                 'timestamp': '时间',
                 'contributors': '贡献者数量',
                 'repository': '仓库'
             },
             category_orders={'repository': sorted(df['repository'].unique())}  # 可选：按特定顺序显示仓库
            )
fig.write_html('contributors_over_time.html')