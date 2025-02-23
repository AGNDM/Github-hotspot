import random
import string
import pandas as pd
import plotly.express as px
import numpy as np
from datetime import datetime, timedelta

# 生成模拟问题数量随时间变化的数据
date_rng = pd.date_range(start='1/1/2021', end='1/1/2023', freq='MS')  # 每月的第一天
issue_data = []
for date in date_rng:
    # 随机生成0到20之间的问题数量
    issue_count = random.randint(0, 20)
    issue_data.append({'Month': date.strftime('%Y-%m'), 'Count': issue_count})

# 将数据转换为DataFrame
issue_counts = pd.DataFrame(issue_data)

# 使用 Plotly 绘制时间线
fig = px.line(issue_counts, x='Month', y='Count', title='Number of Issues Over Time')
fig.write_html("issue_by_time.html")