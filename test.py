import mysql.connector
from mysql.connector import Error

# 配置 MariaDB 连接信息
db_config = {
    'host': '192.168.0.15',         # MariaDB 服务器的 IP 地址
    'user': 'remote_user',          # 数据库授权用户
    'password': '88888888',    # 用户密码
    'database': 'test',    # 数据库名称
    'port': 3306                    # 默认端口号
}

# 测试连接和查询
def test_mariadb_connection():
    try:
        # 尝试连接到 MariaDB
        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():
            print("成功连接到 MariaDB!")
            # 获取 MariaDB 服务器信息
            db_info = connection.get_server_info()
            print(f"MariaDB 服务器版本: {db_info}")

            # 创建游标并执行查询
            cursor = connection.cursor()
            cursor.execute("SHOW TABLES;")
            tables = cursor.fetchall()

            # 输出表信息
            if tables:
                print("数据库中的表:")
                for table in tables:
                    print(f"- {table[0]}")
            else:
                print("数据库中没有表.")

    except Error as e:
        print(f"连接失败: {e}")
    finally:
        # 关闭连接
        if 'connection' in locals() and connection.is_connected():
            connection.close()
            print("连接已关闭.")

# 执行测试
if __name__ == "__main__":
    test_mariadb_connection()
