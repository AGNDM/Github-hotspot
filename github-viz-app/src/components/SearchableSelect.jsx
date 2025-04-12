import Select from 'react-select';
// import { useTheme } from '../contexts/ThemeContext'; // Temporarily removed

const SearchableSelect = ({ options, value, onChange, placeholder, isLoading, isClearable = false, ...props }) => {
    // const { theme } = useTheme ? useTheme() : { theme: 'light' }; // Temporarily removed
    // const customStyles = { ... }; // Temporarily removed

    return (
        <Select
            options={options}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            isLoading={isLoading}
            isClearable={isClearable}
            // styles={customStyles} // Temporarily removed
            {...props}
            // Add basic class for potential minimal styling if needed
            classNamePrefix="react-select"
        />
    );
};

export default SearchableSelect; 