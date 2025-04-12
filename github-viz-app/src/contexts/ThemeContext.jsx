import { createContext, useContext, useState, useEffect } from 'react';

// 创建主题上下文
const ThemeContext = createContext();

// 主题提供者组件
export const ThemeProvider = ({ children }) => {
    // 从localStorage读取主题设置，如果没有则使用light
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('github-viz-theme');
        return savedTheme || 'light';
    });

    // 切换主题函数
    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    // 主题变化时更新body类名和localStorage
    useEffect(() => {
        const body = document.body;
        body.classList.remove('light-theme', 'dark-theme');
        body.classList.add(`${theme}-theme`);
        localStorage.setItem('github-viz-theme', theme);
    }, [theme]);

    // 提供主题上下文值
    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// 自定义hook以使用主题上下文
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeProvider; 