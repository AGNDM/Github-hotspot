import mysql.connector
import os
import github
from mysql.connector import Error
import pycountry
import geopy
import pandas as pd
import plotly.express as px

def standardized_country_name(country_name):
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
    # 搜索所有语言的仓库
    repos = g.search_repositories(query='stars:>1000', sort='stars', order='desc')
    # 获取前1000个仓库的主要开发者的名字和位置信息
    for repo in repos[210:300]:
        try:
            contributors = repo.get_contributors()
            for contributor in contributors[:5]:
                developer_data = []
                developer_data.append(contributor.login)
                developer_data.append(standardized_country_name(contributor.location))
                developer_data.append(contributor.email)
                print(f"已获取{developer_data[0]}的相关信息")

                #输入到数据库
                test_mariadb_connection(developer_data)

        
        except Exception as e:
            print(f"在处理仓库 {repo.full_name} 时发生错误: {e}")
            #继续处理下一个仓库
            continue
    
    return 

# 测试连接和查询
def test_mariadb_connection(data):
    try:
        # 尝试连接到 MariaDB
        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():

            #如果demo表不存在，创建新的表demo
            cursor = connection.cursor()
            cursor.execute("CREATE TABLE IF NOT EXISTS demo (id INT PRIMARY KEY, name VARCHAR(50), region VARCHAR(40), email VARCHAR(50));")

            #清空表
#            cursor.execute("TRUNCATE TABLE demo;")

            #把data里面的数据插入到数据库
            try:
                #获取目前数据库最大的主键
                cursor.execute("SELECT MAX(id) FROM demo;")
                curr_max_id = cursor.fetchone()[0]
                if curr_max_id is None:
                    curr_max_id = 0
                primary_key = curr_max_id + 1
                #插入数据
                cursor.execute(f"INSERT INTO demo (id, name, region, email) VALUES ({primary_key}, '{data[0]}', '{data[1]}', '{data[2]}');")
                print(f"成功插入数据: {data}")

            except Exception as e:
                print(f"在插入数据时发生错误: {e}")
                return
                

            #提交
            connection.commit()

    except Error as e:
        print(f"连接失败: {e}")
    finally:
        # 关闭连接
        if 'connection' in locals() and connection.is_connected():
            connection.close()

#读取数据库中的数据并生成地区热力图
def test_mariadb_data():
    try:
        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():
            print("成功连接到 MariaDB!开始进行热力图绘制")
            db_info = connection.get_server_info()
            print(f"MariaDB 服务器版本: {db_info}")
            cursor = connection.cursor()
            cursor.execute("SELECT region, COUNT(*) AS count FROM demo GROUP BY region;")
            records = cursor.fetchall()
            # 生成地区热力图
            df = pd.DataFrame(records, columns=['region', 'count'])
            max_count = df['count'].max() / 2
            fig = px.choropleth(
                df, 
                locations=df['region'], 
                locationmode='country names', 
                color=df['count'], 
                color_continuous_scale='Reds', 
                range_color=(0, max_count/2),
            )
            fig.update_layout(
                title_text='Top 300 Repositories Developers Heatmap',
                title_x=0.5,
                title_xanchor="center",
                title_yanchor="top",
                font=dict(size=20)
            )
            fig.show()
    except Exception as e:
        print(f"在查询数据时发生错误: {e}")

# 执行测试
if __name__ == "__main__":
#    data = get_github_data()
    test_mariadb_data()
    print("数据库插入完成")
