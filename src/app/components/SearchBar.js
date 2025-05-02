import { FiSearch } from 'react-icons/fi';
import { useTheme } from 'next-themes';

export default function SearchBar({ value, onChange }) {
  const { theme } = useTheme();
  
  return (
    <div className={`relative w-full ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search notes..."
        className={`w-full py-3 pl-12 pr-4 rounded-full ${
          theme === 'dark'
            ? 'bg-gray-800 focus:bg-gray-700 border-gray-700'
            : 'bg-white focus:bg-gray-50 border-gray-200'
        } border focus:outline-none focus:ring-2 ${
          theme === 'dark' ? 'focus:ring-gray-600' : 'focus:ring-gray-200'
        } transition-all duration-300`}
      />
      <FiSearch 
        className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`} 
        size={20} 
      />
    </div>
  );
}