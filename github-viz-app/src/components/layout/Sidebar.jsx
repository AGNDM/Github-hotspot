import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';
import {
    ChartPieIcon,
    StarIcon,
    //UsersIcon,
    GlobeIcon,
    CalendarIcon,
    TrendingUpIcon,
    OfficeBuildingIcon,
    //ExclamationCircleIcon,
    HomeIcon,
    ViewGridIcon
} from '@heroicons/react/outline';

const Sidebar = ({ isOpen, activePage, setActivePage }) => {
    const navListRef = useRef(null);
    const mouseY = useMotionValue(Infinity);

    const navItems = [
        { id: 'dashboard', label: '概览', icon: <HomeIcon className="w-5 h-5" /> },
        { id: 'language-distribution', label: '编程语言分布', icon: <ChartPieIcon className="w-5 h-5" /> },
        { id: 'top-repositories', label: '最受欢迎仓库', icon: <StarIcon className="w-5 h-5" /> },
        { id: 'contributor-locations', label: '贡献者地区', icon: <GlobeIcon className="w-5 h-5" /> },
        { id: 'activity-heatmap', label: '活跃度热图', icon: <CalendarIcon className="w-5 h-5" /> },
        { id: 'language-trends', label: '语言趋势', icon: <TrendingUpIcon className="w-5 h-5" /> },
        { id: 'company-distribution', label: '公司分布', icon: <OfficeBuildingIcon className="w-5 h-5" /> },
        { id: 'stars-contributors-issues', label: '星标、贡献者与问题', icon: <ViewGridIcon className="w-5 h-5" /> },
    ];

    // 侧边栏动画
    const sidebarVariants = {
        open: { width: '240px', transition: { duration: 0.3 } },
        closed: { width: '70px', transition: { duration: 0.3 } }
    };

    return (
        <motion.aside
            className={`sidebar`}
            variants={sidebarVariants}
            animate={isOpen ? 'open' : 'closed'}
            initial={isOpen ? 'open' : 'closed'}
        >
            <div className="sidebar-content">
                <div className="sidebar-header">
                    {isOpen && <h2 className="sidebar-title">GitHub数据</h2>}
                </div>

                <nav className="sidebar-nav">
                    <motion.ul
                        ref={navListRef}
                        style={{
                            y: mouseY,
                            transition: useSpring(mouseY, {
                                stiffness: 100,
                                damping: 30,
                                mass: 0.5
                            })
                        }}
                    >
                        {navItems.map((item) => (
                            <li key={item.id}>
                                <button
                                    className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                                    onClick={() => setActivePage(item.id)}
                                    title={!isOpen ? item.label : ''}
                                >
                                    <span className="icon">{item.icon}</span>
                                    {isOpen && <span className="label">{item.label}</span>}
                                </button>
                            </li>
                        ))}
                    </motion.ul>
                </nav>
            </div>
        </motion.aside>
    );
};

export default Sidebar; 