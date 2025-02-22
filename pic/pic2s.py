import plotly.graph_objects as go
import pandas as pd

def create_figure():
    df = pd.read_csv('data(csv)/test2.csv')
    df['count'] = 1
    
    # 按年份分组
    years = sorted(df['year'].unique())

    # 创建空Figure
    fig = go.Figure()

    # 为每个年份增加一个扇形图trace
    for i, y in enumerate(years):
        df_year = df[df['year'] == y]
        fig.add_trace(
            go.Pie(
                labels=df_year['tag'],
                values=df_year['count'],
                name=str(y),
                # 只有第一个年份默认可见，其它年份先隐藏
                visible=(i == 0)
            )
        )

    # 构造下拉菜单选项，每个选项对应一个年份
    # 通过更新 trace 的 'visible' 属性来控制显示哪一个年份的扇形图
    buttons = []
    for y in years:
        button = dict(
            label=str(y),
            method="update",
            args=[
                {"visible": [False]*len(years)}
            ],
        )
        buttons.append(button)

    updatemenus = [
        dict(
            type="dropdown",
            x=0.1,     # 下拉菜单水平位置
            y=1.2,     # 下拉菜单垂直位置
            showactive=True,
            active=0,
            bgcolor='white',
            font=dict(color='black'),
            borderwidth=0,
            buttons=buttons
        )
    ]

    # 按钮回调：点选哪一年，就只显示相应的trace
    # 由于上面 buttons 中只给 {"visible": [False]*len(years)}，还需要在循环后再补充可见性处理
    # 所以我们在循环之后为每个年份的按钮分别指定对应的可见 trace
    
    for idx in range(len(years)):
        # 更新每个按钮的args[0]["visible"]列表
        updatemenus[0]["buttons"][idx]["args"][0]["visible"][idx] = True

    # 更新布局，将 updatemenus 设置到 figure 中
    fig.update_layout(
        title="各年份Tag分布",
        #位置处于pie图的正上方
        title_x=0.5,
        #设置主题
        template='simple_white',
        updatemenus=updatemenus
    )

    fig.show()

if __name__ == "__main__":
    create_figure()