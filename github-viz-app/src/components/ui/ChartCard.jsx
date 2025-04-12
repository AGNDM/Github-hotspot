import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { RefreshIcon, MenuIcon, DownloadIcon, InformationCircleIcon } from '@heroicons/react/outline';

const ChartCard = ({
    children,
    title,
    description = '',
    className = '',
    onRefresh = null,
    downloadUrl = null
}) => {
    const { theme } = useTheme();
    const [showInfo, setShowInfo] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const toggleInfo = () => {
        setShowInfo(!showInfo);
    };

    const handleRefresh = () => {
        if (onRefresh && typeof onRefresh === 'function') {
            onRefresh();
        }
    };

    const handleDownload = () => {
        if (downloadUrl) {
            window.open(downloadUrl, '_blank');
        }
    };

    return (
        <motion.div
            className={`chart-card ${className} ${theme}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="chart-card-header">
                <h3 className="chart-card-title">{title}</h3>
                <div className="chart-card-actions">
                    {description && (
                        <button
                            className="chart-card-action-btn info-btn"
                            onClick={toggleInfo}
                            aria-label="显示信息"
                        >
                            <InformationCircleIcon className="w-5 h-5" />
                        </button>
                    )}

                    {onRefresh && (
                        <button
                            className="chart-card-action-btn refresh-btn"
                            onClick={handleRefresh}
                            aria-label="刷新数据"
                        >
                            <RefreshIcon className="w-5 h-5" />
                        </button>
                    )}

                    {downloadUrl && (
                        <button
                            className="chart-card-action-btn download-btn"
                            onClick={handleDownload}
                            aria-label="下载数据"
                        >
                            <DownloadIcon className="w-5 h-5" />
                        </button>
                    )}

                    <button
                        className="chart-card-action-btn menu-btn"
                        onClick={toggleMenu}
                        aria-label="菜单"
                    >
                        <MenuIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {showInfo && description && (
                <motion.div
                    className="chart-card-description"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <p>{description}</p>
                </motion.div>
            )}

            {menuOpen && (
                <motion.div
                    className="chart-card-menu"
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ul>
                        {onRefresh && <li onClick={handleRefresh}>刷新图表</li>}
                        {downloadUrl && <li onClick={handleDownload}>下载数据</li>}
                        <li onClick={toggleInfo}>
                            {showInfo ? '隐藏描述' : '显示描述'}
                        </li>
                        <li onClick={() => setMenuOpen(false)}>关闭</li>
                    </ul>
                </motion.div>
            )}

            <div className="chart-card-content">
                {children}
            </div>
        </motion.div>
    );
};

export default ChartCard; 