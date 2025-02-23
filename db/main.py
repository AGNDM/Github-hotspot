import mysql.connector
import os
import github
from mysql.connector import Error
import cname
import datetime
import json

# 配置 MariaDB 连接信息
db_config = {
    'host': '192.168.0.15',         # MariaDB 服务器的 IP 地址
    'user': 'remote_user',          # 数据库授权用户
    'password': '88888888',    # 用户密码
    'database': 'test',    # 数据库名称
    'port': 3306                    # 默认端口号
}

today_date = datetime.datetime.now().strftime("%Y%m%d")
#table_c_name = f"demo_c_{today_date}"
table_c_name=f"con"
#table_r_name = f"demo_r_{today_date}"
table_r_name = f"repo"

# 获取star数前1000的仓库中前5个contributor的数据
def get_contributor_data():
    # 使用个人访问令牌进行身份验证
    token = os.getenv('GITHUB_TOKEN')
    g = github.Github(token)
    repos = g.search_repositories(query='stars:>1000', sort='stars', order='desc')
    for repo in repos[:2]:
        try:
            contributors = repo.get_contributors()
            for contributor in contributors[:5]:
                developer_data = []
                developer_data.append(contributor.login)
                developer_data.append(cname.standardized_country_name(contributor.location))
                developer_data.append(contributor.email)
                developer_data.append(repo.name)
                print(f"已获取{developer_data[0]}的相关信息")

                #输入到数据库
                update2db_c(developer_data)
        
        except Exception as e:
            print(f"在处理仓库 {repo.full_name} 时发生错误: {e}")
            #继续处理下一个仓库
            continue
    
    return 

# 测试连接和将contributor数据输入到数据库
def update2db_c(data):
    try:
        # 尝试连接到 MariaDB
        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():

            #如果demo表不存在，创建新的表demo
            cursor = connection.cursor()
            cursor.execute(f"CREATE TABLE IF NOT EXISTS {table_c_name} (id INT PRIMARY KEY, name VARCHAR(50), region VARCHAR(40), email VARCHAR(50), UNIQUE KEY unique_dev (name, email));")

            #查询是否已存在相同的 name 和 email
            cursor.execute(f"SELECT COUNT(*) FROM {table_c_name} WHERE name = %s AND email = %s;", (data[0], data[2]))
            exists = cursor.fetchone()[0]
            if exists == 0:
                #把data里面的数据插入到数据库
                try:
                    #获取目前数据库最大的主键
                    cursor.execute(f"SELECT MAX(id) FROM {table_c_name};")
                    curr_max_id = cursor.fetchone()[0]
                    if curr_max_id is None:
                        curr_max_id = 0
                    primary_key = curr_max_id + 1
                    #插入数据
                    cursor.execute(f"INSERT INTO {table_c_name} (id, name, region, email) VALUES ({primary_key}, '{data[0]}', '{data[1]}', '{data[2]}');")
                    print(f"成功插入数据{data}到表{table_c_name}")

                except Exception as e:
                    print(f"在插入数据到表{table_c_name}时发生错误: {e}")
                    return
            else:
                print(f"数据已存在，跳过: {data}")

            cursor.execute(f"CREATE TABLE IF NOT EXISTS repository_contributors (repo_name VARCHAR(50),con_name VARCHAR(50),PRIMARY KEY (repo_name, con_name));")
            try:
                cursor.execute(f"INSERT INTO repository_contributors (repo_name, con_name) VALUES ('{data[0]}', '{data[3]}');")
                print(f"成功插入数据{data}到表repository_contributors")
            except Exception as e:
                    print(f"在插入数据到表repository_contributors时发生错误: {e}")
                    return    

            #提交
            connection.commit()

    except Error as e:
        print(f"连接失败: {e}")
    finally:
        # 关闭连接
        if 'connection' in locals() and connection.is_connected():
            connection.close()

'''
# 获取star数超过1000的repository的数据
def get_repository_data():
    # 使用个人访问令牌进行身份验证
    token = os.getenv('GITHUB_TOKEN')
    g = github.Github(token)
    repos = g.search_repositories(query='stars:>1000', sort='stars', order='desc')
    for repo in repos[:10]:
        try:
            developer_data = []
            developer_data.append(repo.name)
            developer_data.append(repo.stargazers_count)
            developer_data.append(repo.language)
            print(f"已获取{developer_data[0]}的相关信息")

            #输入到数据库
            update2db_r(developer_data)
        
        except Exception as e:
            print(f"在处理仓库 {repo.full_name} 时发生错误: {e}")
            #继续处理下一个仓库
            continue
    
    return 

# 测试连接和将repository数据输入到数据库
def update2db_r(data):
    try:
        # 尝试连接到 MariaDB
        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():
            #如果demo表不存在，创建新的表demo
            cursor = connection.cursor()
            cursor.execute(f"CREATE TABLE IF NOT EXISTS {table_r_name} (id INT PRIMARY KEY, name VARCHAR(50), star INT, language VARCHAR(50));")
            #把data里面的数据插入到数据库
            try:
                #获取目前数据库最大的主键
                cursor.execute(f"SELECT MAX(id) FROM {table_r_name};")
                curr_max_id = cursor.fetchone()[0]
                if curr_max_id is None:
                    curr_max_id = 0
                primary_key = curr_max_id + 1
                #插入数据
                cursor.execute(f"INSERT INTO {table_r_name} (id, name, star, language) VALUES ({primary_key}, '{data[0]}', '{data[1]}', '{data[2]}');")
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
'''

# 查询表函数
def select_data():
    table_name = input("请输入要查询的表名：")
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()

        cursor.execute(f"SELECT * FROM {table_name};")
        rows = cursor.fetchall()

        if rows:
            for row in rows:
                print(row)
        else:
            print(f"表 {table_name} 中没有数据。")

    except mysql.connector.Error as err:
        print(f"查询数据时发生错误: {err}")
    finally:
        if connection.is_connected():
            connection.close()

# 删除表函数
def delete_data():
    table_name = input("请输入要删除的表名：")
    try:
        connection = mysql.connector.connect(**db_config)
        cursor = connection.cursor()

        cursor.execute(f"DROP TABLE IF EXISTS {table_name};")
        print(f"{table_name} 已被删除。")

    except mysql.connector.Error as err:
        print(f"删除数据时发生错误: {err}")
    finally:
        if connection.is_connected():
            connection.close()

# 获取star数超过1000的repository的数据
def get_repository_data():
    # 使用个人访问令牌进行身份验证
    token = os.getenv('GITHUB_TOKEN')
    g = github.Github(token)
    repos = g.search_repositories(query='stars:>1000', sort='stars', order='desc')
    for repo in repos[100:1000]:
        try:
            developer_data = []
            developer_data.append(repo.name)
            developer_data.append(repo.stargazers_count)
            developer_data.append(repo.get_contributors().totalCount)
            developer_data.append(json.dumps(repo.get_topics()))
            developer_data.append(repo.forks_count)
            developer_data.append(repo.get_issues(state='all').totalCount)
            developer_data.append(repo.created_at.strftime('%Y-%m-%d'))
            print(f"已获取{developer_data[0]}的相关信息")

            #输入到数据库
            update2db_r(developer_data)
        
        except Exception as e:
            print(f"在处理仓库 {repo.full_name} 时发生错误: {e}")
            #继续处理下一个仓库
            continue
    
    return 

# 测试连接和将repository数据输入到数据库
def update2db_r(data):
    try:
        # 尝试连接到 MariaDB
        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():
            #如果demo表不存在，创建新的表demo
            cursor = connection.cursor()
            cursor.execute(f"CREATE TABLE IF NOT EXISTS {table_r_name} (id INT PRIMARY KEY, name VARCHAR(50), star INT, contributors INT, topics TEXT, forks INT, issues INT, createdate VARCHAR(50));")
            #把data里面的数据插入到数据库
            try:
                #获取目前数据库最大的主键
                cursor.execute(f"SELECT MAX(id) FROM {table_r_name};")
                curr_max_id = cursor.fetchone()[0]
                if curr_max_id is None:
                    curr_max_id = 0
                primary_key = curr_max_id + 1
                #插入数据
                cursor.execute(f"INSERT INTO {table_r_name} (id, name, star, contributors, topics, forks, issues, createdate) VALUES ({primary_key}, '{data[0]}', '{data[1]}', '{data[2]}', '{data[3]}', '{data[4]}', '{data[5]}', '{data[6]}');")
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

# 执行测试
if __name__ == "__main__":
#    get_contributor_data()
    get_repository_data()
    select_data()
    delete_data()
    print("数据库插入完成")
