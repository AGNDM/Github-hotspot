#创建一个统计仓库热门程度和贡献者数量关系的三点图，热门程度依照是star数量来判断
#所需参数：第一行为仓库名，第二行为仓库的star数量，第三行为仓库的贡献者数量
#使用plotlyexpress
import plotly.express as px
import pandas as pd

def create_figure():
    #读取../data(csv)/test1.csv文件中的数据
    df = pd.read_csv('data(csv)/test1.csv')
    #创建一个散点图
    fig = px.scatter(df, 
                     x='stars', 
                     y='contributors',
                     title='仓库热门程度和贡献者数量关系',
                     hover_data=['repository', 'stars', 'contributors','tag'],
#                     trendline='ols',
                     template="simple_white",
                     color='tag')

    fig.update_layout(
        title_x=0.5,
        title_xanchor="center",
        title_yanchor="top",
        font=dict(size=15),
    )
    fig.show()

if __name__ == '__main__':
    create_figure()