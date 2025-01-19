#此测试将实现连接数据库，查询数据，并根据数据生成地区热力图,具体使用的库参照help文件
import mysql.connector
import plotly.express as px
import pandas as pd

# 数据库连接配置
db_config = {
    'host': '192.168.0.15',         # MariaDB 服务器的 IP 地址
    'user': 'remote_user',          # 数据库授权用户
    'password': '88888888',    # 用户密码
    'database': 'test',    # 数据库名称
    'port': 3306                    # 默认端口号
}

# 简单确认连接状态
def test_mariadb_connection():
    try:
        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():
            print("成功连接到 MariaDB!")
            db_info = connection.get_server_info()
            print(f"MariaDB 服务器版本: {db_info}")
    except Exception as e:
        print(f"连接到 MariaDB 时发生错误: {e}")

# 查询数据并生成地区热力图
def test_mariadb_data():
    try:
        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():
            print("成功连接到 MariaDB!")
            db_info = connection.get_server_info()
            print(f"MariaDB 服务器版本: {db_info}")
            cursor = connection.cursor()
            cursor.execute("SELECT region, COUNT(*) AS count FROM demo GROUP BY region;")
            records = cursor.fetchall()
            # 生成地区热力图
            df = pd.DataFrame(records, columns=['region', 'count'])
            fig = px.choropleth(df, locations=df['region'], locationmode='country names', color=df['count'], color_continuous_scale='Viridis', range_color=(0, 10))
            fig.show()
    except Exception as e:
        print(f"在查询数据时发生错误: {e}")

# 主函数
if __name__ == '__main__':
    test_mariadb_connection()
    test_mariadb_data()



