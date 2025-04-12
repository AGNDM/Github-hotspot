import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const GitHubDataContext = createContext();

export const useGitHubData = () => useContext(GitHubDataContext);

export const GitHubDataProvider = ({ children }) => {
    const [repositories, setRepositories] = useState([]);
    const [contributors, setContributors] = useState([]);
    const [activities, setActivities] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [trendingRepos, setTrendingRepos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // 初始化加载所有数据
    useEffect(() => {
        fetchAllData();
    }, []);

    // 获取所有数据
    const fetchAllData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            await Promise.all([
                fetchRepositories(),
                fetchContributors(),
                fetchActivities(),
                fetchLanguages(),
                fetchTrendingRepos()
            ]);

            setLastUpdated(new Date().toISOString());
        } catch (err) {
            setError(err.message || '获取数据失败');
            toast.error('获取数据失败，请稍后再试');
        } finally {
            setIsLoading(false);
        }
    };

    // 获取所有仓库数据
    const fetchRepositories = async () => {
        const response = await axios.get('/api/repositories');
        setRepositories(response.data);
        return response.data;
    };

    // 获取贡献者数据
    const fetchContributors = async () => {
        const response = await axios.get('/api/contributors');
        setContributors(response.data);
        return response.data;
    };

    // 获取活动数据
    const fetchActivities = async () => {
        const response = await axios.get('/api/activities');
        setActivities(response.data);
        return response.data;
    };

    // 获取语言分布数据
    const fetchLanguages = async () => {
        const response = await axios.get('/api/languages');
        setLanguages(response.data);
        return response.data;
    };

    // 获取趋势仓库数据
    const fetchTrendingRepos = async () => {
        const response = await axios.get('/api/trending');
        setTrendingRepos(response.data);
        return response.data;
    };

    // 刷新所有数据
    const refreshData = async () => {
        setIsLoading(true);
        await fetchAllData();
        setIsLoading(false);
    };

    return (
        <GitHubDataContext.Provider
            value={{
                repositories,
                contributors,
                activities,
                languages,
                trendingRepos,
                isLoading,
                error,
                lastUpdated,
                refreshData,
            }}
        >
            {children}
        </GitHubDataContext.Provider>
    );
};

export default GitHubDataProvider; 