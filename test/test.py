import mysql.connector
import os
import github
from mysql.connector import Error
import pycountry
import geopy
import pandas as pd
import plotly.express as px

def standardize_country_name(country_name):
    if country_name is None:
        return None

    # 尝试从 pycountry 库中查找国家代码
    try:
        country_code = pycountry.countries.lookup(country_name).alpha_2
        return pycountry.countries.get(alpha_2=country_code).name
    except LookupError:
        pass

    # 尝试从 geopy 库中查找国家代码
    try:
        geolocator = geopy.Nominatim(user_agent="standardize_country_name")
        location = geolocator.geocode(country_name, language='en')
        return location.address.split(',')[-1].strip()
    except Exception as e:
        return None 

# 配置 MariaDB 连接信息
db_config = {
    'host': '192.168.0.15',         # MariaDB 服务器的 IP 地址
    'user': 'remote_user',          # 数据库授权用户
    'password': '88888888',    # 用户密码
    'database': 'test',    # 数据库名称
    'port': 3306                    # 默认端口号
}

# 利用github库获取数据，为插入数据库做准备
def get_github_data():
    # 使用个人访问令牌进行身份验证
    token = os.getenv('GITHUB_TOKEN')
    g = github.Github(token)
    # 搜索 Python 语言的仓库
    repos = g.search_repositories(query='language:python', sort='stars', order='desc')
    # 获取前100个仓库的主要开发者的名字和位置信息
    developer_data = []
    for repo in repos[:100]:
        contributors = repo.get_contributors()
        for contributor in contributors[:5]:
            developer_data.append((contributor.login,standardize_country_name(contributor.location), contributor.email))
            print(developer_data[-1], developer_data.__len__())
    
    return developer_data

# 测试连接和查询
def test_mariadb_connection(data):
    try:
        # 尝试连接到 MariaDB
        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():
            print("成功连接到 MariaDB!")
            # 获取 MariaDB 服务器信息
            db_info = connection.get_server_info()
            print(f"MariaDB 服务器版本: {db_info}")

            #如果demo表不存在，创建新的表demo
            cursor = connection.cursor()

            #demo( id int primary key, name varchar(50), region varchar(40), email varchar(50))
            cursor.execute("CREATE TABLE IF NOT EXISTS demo (id INT PRIMARY KEY, name VARCHAR(50), region VARCHAR(40), email VARCHAR(50));")

            #清空表
            cursor.execute("TRUNCATE TABLE demo;")

#            # 插入10条编造的随机数据
#            cursor.execute("INSERT INTO demo (id, name, region) VALUES (1, 'Alice', 'China');")
#            cursor.execute("INSERT INTO demo (id, name, region) VALUES (2, 'Bob', 'USA');")
#            cursor.execute("INSERT INTO demo (id, name, region) VALUES (3, 'Charlie', 'UK');")
#            cursor.execute("INSERT INTO demo (id, name, region) VALUES (4, 'David', 'Canada');")
#            cursor.execute("INSERT INTO demo (id, name, region) VALUES (5, 'Eva', 'China');")
#            cursor.execute("INSERT INTO demo (id, name, region) VALUES (6, 'Frank', 'USA');")
#            cursor.execute("INSERT INTO demo (id, name, region) VALUES (7, 'Grace', 'UK');")
#            cursor.execute("INSERT INTO demo (id, name, region) VALUES (8, 'Henry', 'Canada');")
#            cursor.execute("INSERT INTO demo (id, name, region) VALUES (9, 'Ivy', 'China');")
#            cursor.execute("INSERT INTO demo (id, name, region) VALUES (10, 'Jack', 'USA');")
            #把data里面的数据插入到数据库
            for i in range(data.__len__()):
                cursor.execute(f"INSERT INTO demo (id, name, region, email) VALUES ({i+1}, '{data[i][0]}', '{data[i][1]}', '{data[i][2]}');")


            #提交
            connection.commit()

#            #查看demo表中的数据
#            cursor.execute("SELECT * FROM demo;")
#            records = cursor.fetchall()
#            print("demo表中的数据:")
#            for record in records:
#                print(f"- {record}")
#
#            # 创建游标并执行查询
#            cursor = connection.cursor()
#            cursor.execute("SHOW TABLES;")
#            tables = cursor.fetchall()
#
#            # 输出表信息
#            if tables:
#                print("数据库中的表:")
#                for table in tables:
#                    print(f"- {table}")
#            else:
#                print("数据库中没有表.")


    except Error as e:
        print(f"连接失败: {e}")
    finally:
        # 关闭连接
        if 'connection' in locals() and connection.is_connected():
            connection.close()
            print("连接已关闭.")

#读取数据库中的数据并生成地区热力图
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
            max_count = df['count'].max() / 2
            fig = px.choropleth(df, locations=df['region'], locationmode='country names', color=df['count'], color_continuous_scale='Viridis', range_color=(0, max_count))
            fig.show()
    except Exception as e:
        print(f"在查询数据时发生错误: {e}")

# 执行测试
if __name__ == "__main__":
#    data = get_github_data()
#    test_mariadb_connection(data)
    test_mariadb_data()
