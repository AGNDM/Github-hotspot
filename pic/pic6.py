import pymysql
import pandas as pd
import plotly.express as px
# 数据库连接配置
db_config = {
'host': '192.168.0.15',
'user': 'remote_user',
'password': '88888888',
'database': 'test',
'port': 3306
}
# 连接到数据库
connection = pymysql.connect(
    host=db_config['host'],
    user=db_config['user'],
    password=db_config['password'],
    database=db_config['database'],
    port=db_config['port']
)

try:
 # 执行SQL查询
 query = "SELECT * FROM demo"
 df = pd.read_sql_query(query, connection)
 # 将DataFrame转换为NumPy数组
 data_array = df.to_numpy()

 columns = ['num', 'ID', 'nationality', 'email'] 

 df = pd.DataFrame(data_array, columns=columns)
 fig = px.bar(df, x='nationality', y='num', title='Nationality Distribution',
             labels={'num': 'Count'}, 
             barmode='group')
 fig.write_html("htmlfigure/pic6_nationality_distribution_bar.html")
finally:
# 关闭数据库连接
 connection.close()