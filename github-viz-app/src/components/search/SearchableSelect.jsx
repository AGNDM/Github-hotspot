import Select from 'react-select';
// 重要：这个组件假设您有一个 ThemeContext 来获取当前的亮/暗主题
// 如果您没有 ThemeContext，需要调整获取主题的方式，或者暂时移除主题相关的样式逻辑
// import { useTheme } from '../contexts/ThemeContext'; 

const SearchableSelect = ({ options, value, onChange, placeholder, isLoading, isClearable = false, ...props }) => {
    // 假设获取主题的逻辑，如果您的项目没有 useTheme，请修改或移除
    // const { theme } = useTheme ? useTheme() : { theme: 'light' }; // Fallback to light theme
    const theme = 'light'; // Temporary fallback - REMOVE THIS and use your theme logic

    // --- Define styles for react-select based on theme ---
    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            backgroundColor: theme === 'dark' ? '#2d3748' : '#ffffff',
            borderColor: state.isFocused
                ? (theme === 'dark' ? '#61dafb' : '#3182ce') // Accent color on focus
                : (theme === 'dark' ? '#2d3748' : '#e2e8f0'), // Border color
            boxShadow: state.isFocused
                ? (theme === 'dark' ? '0 0 0 1px #61dafb' : '0 0 0 1px #3182ce') // Focus ring
                : 'none',
            '&:hover': {
                borderColor: state.isFocused
                    ? (theme === 'dark' ? '#61dafb' : '#3182ce')
                    : (theme === 'dark' ? '#4a5568' : '#cbd5e0')
            },
            minHeight: '40px', // Match other inputs/selects if needed
            cursor: 'pointer'
        }),
        valueContainer: (provided) => ({
            ...provided,
            padding: '2px 8px'
        }),
        singleValue: (provided) => ({
            ...provided,
            color: theme === 'dark' ? '#f7fafc' : '#1a202c' // Text color
        }),
        placeholder: (provided) => ({
            ...provided,
            color: theme === 'dark' ? '#a0aec0' : '#a0aec0' // Placeholder text color
        }),
        input: (provided) => ({
            ...provided,
            color: theme === 'dark' ? '#f7fafc' : '#1a202c' // Input text color
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: theme === 'dark' ? '#1a202c' : '#ffffff', // Dropdown background
            border: `1px solid ${theme === 'dark' ? '#2d3748' : '#e2e8f0'}`,
            boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 20 // Ensure dropdown is above other elements
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected
                ? (theme === 'dark' ? '#4cc1e9' : '#3182ce') // Selected option background
                : state.isFocused
                    ? (theme === 'dark' ? '#2d3748' : '#edf2f7') // Focused option background
                    : 'transparent',
            color: state.isSelected
                ? (theme === 'dark' ? '#171923' : '#ffffff') // Selected option text
                : (theme === 'dark' ? '#e2e8f0' : '#1a202c'), // Option text
            padding: '10px 15px',
            cursor: 'pointer',
            '&:active': {
                backgroundColor: theme === 'dark' ? '#4cc1e9' : '#3182ce', // Active option background
                color: theme === 'dark' ? '#171923' : '#ffffff'
            }
        }),
        indicatorSeparator: () => ({
            display: 'none' // Hide the vertical separator
        }),
        dropdownIndicator: (provided) => ({
            ...provided,
            color: theme === 'dark' ? '#a0aec0' : '#a0aec0', // Arrow color
            '&:hover': {
                color: theme === 'dark' ? '#e2e8f0' : '#4a5568'
            }
        }),
        clearIndicator: (provided) => ({
            ...provided,
            color: theme === 'dark' ? '#a0aec0' : '#a0aec0',
            '&:hover': {
                color: theme === 'dark' ? '#e2e8f0' : '#4a5568'
            }
        }),
        loadingIndicator: (provided) => ({
            ...provided,
            color: theme === 'dark' ? '#a0aec0' : '#a0aec0'
        }),
        // Add other parts like multiValue, etc. if needed
    };

    return (
        <Select
            options={options}
            value={value} // react-select expects the full option object { value: ..., label: ... } for controlled components
            onChange={onChange} // Pass the full option object or null to the handler
            placeholder={placeholder}
            isLoading={isLoading}
            isClearable={isClearable}
            styles={customStyles}
            {...props} // Pass any additional props
        />
    );
};

export default SearchableSelect;
