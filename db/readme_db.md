get_repository_data函数用于获取star数超过1000的仓库信息
update2db_r函数将获取到的仓库信息输入到数据库
表格名称为'demo_r_获取数据的当天日期'，如'demo_r_20250223'
表格的数据类型依次为
(id INT PRIMARY KEY, 
name VARCHAR(50), 
star INT, 
contributors INT, 
topics TEXT, //text类型，格式为'["aaaaa", "bbbbb", "ccccc"]'如'["education", "books", "list", "resource", "hacktoberfest"]'
forks INT, 
issues INT, 
createdate VARCHAR(50)) //字符串类型，格式为'yyyy-mm-dd'，如'2013-10-11'