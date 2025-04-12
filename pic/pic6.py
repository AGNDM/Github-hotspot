import pandas as pd
import plotly.express as px
import numpy as np
import datetime
 
 
# 代码行数变化数据（时间序列）
dates = pd.date_range(start='2023-01-01', periods=10, freq='M')  # 假设10个月的数据
code_lines = np.random.randint(1000, 2000, size=len(dates))  # 随机生成的代码行数
code_changes = pd.DataFrame({'Date': dates, 'Code Lines': code_lines})
 
 
# 可视化部分
# 时间序列图，显示代码行数随时间的变化
fig_code_lines = px.line(code_changes, x='Date', y='Code Lines', title='Code Lines Over Time')
fig_code_lines.write_html("code_lines_over_time.html")
