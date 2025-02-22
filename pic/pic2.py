#生成一个饼图，其中有一个控件可以选定某一年的数据
#饼图显示该年数据标签的比例
import plotly.express as px
import pandas as pd

def create_figure():
    df = pd.read_csv('data(csv)/test2.csv')
    # 为每条记录加一个计数列
    df['count'] = 1

    # 使用 animation_frame 根据 year 生成可切换的饼图
    fig = px.pie(
        df,
        names='tag',      # 以 tag 作为名称
        values='count',   # 每条记录记为 1 个计数
        title='各年份Tag分布'
    )
    fig.show()

if __name__ == '__main__':
    create_figure()
