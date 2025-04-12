import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import LanguageDistribution from './pages/LanguageDistribution';
import TopRepositories from './pages/TopRepositories';
// import StarsContributorsRelation from './pages/StarsContributorsRelation';
import ContributorLocations from './pages/ContributorLocations';
import ActivityHeatmap from './pages/ActivityHeatmap';
import LanguageTrends from './pages/LanguageTrends';
import CompanyDistribution from './pages/CompanyDistribution';
// import StarsIssuesRelation from './pages/StarsIssuesRelation';
import StarsContributorsIssuesRelation from './pages/StarsContributorsIssuesRelation';
import './styles/globals.css';

function App() {
    const [activePage, setActivePage] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // 动画设置
    const pageVariants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    };

    // 渲染当前激活的页面
    const renderActivePage = () => {
        switch (activePage) {
            case 'dashboard':
                return <Dashboard />;
            case 'language-distribution':
                return <LanguageDistribution />;
            case 'top-repositories':
                return <TopRepositories />;
            // case 'stars-contributors':
            //     return <StarsContributorsRelation />;
            case 'contributor-locations':
                return <ContributorLocations />;
            case 'activity-heatmap':
                return <ActivityHeatmap />;
            case 'language-trends':
                return <LanguageTrends />;
            case 'company-distribution':
                return <CompanyDistribution />;
            // case 'stars-issues':
            //     return <StarsIssuesRelation />;
            case 'stars-contributors-issues':
                return <StarsContributorsIssuesRelation />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <ThemeProvider>
            <div className="app-container">
                <Toaster position="top-right" />
                <Header toggleSidebar={toggleSidebar} />
                <div className="main-content">
                    <Sidebar
                        isOpen={isSidebarOpen}
                        activePage={activePage}
                        setActivePage={setActivePage}
                    />
                    <main className={`content ${!isSidebarOpen ? 'expanded' : ''}`}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activePage}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                variants={pageVariants}
                                transition={{ type: 'tween', duration: 0.3 }}
                                className="page-container"
                            >
                                {renderActivePage()}
                            </motion.div>
                        </AnimatePresence>
                    </main>
                </div>
            </div>
        </ThemeProvider>
    );
}

export default App; 