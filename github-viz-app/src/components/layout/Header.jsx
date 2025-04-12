import { MenuIcon } from '@heroicons/react/outline';

const Header = ({ toggleSidebar }) => {
    return (
        <header className="header">
            <div className="header-title">
                <button
                    className="sidebar-toggle"
                    onClick={toggleSidebar}
                    aria-label="切换侧边栏"
                >
                    <MenuIcon className="w-6 h-6" />
                </button>
                <span>GitHub 数据可视化</span>
            </div>
            <div className="header-actions">
                {/* 可以添加其他操作按钮，如搜索、用户菜单等 */}
            </div>
        </header>
    );
};

export default Header; 