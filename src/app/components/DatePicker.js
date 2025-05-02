import { useTheme } from 'next-themes';
import { format } from 'date-fns';
import { FiCalendar } from 'react-icons/fi';

export default function DatePicker({ dates, selectedDate, onChange }) {
  const { theme } = useTheme();
  
  return (
    <div className={`relative w-full max-w-[200px] ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
      <div className="relative">
        <select
          value={selectedDate || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className={`w-full py-3 pl-12 pr-4 rounded-full appearance-none ${
            theme === 'dark'
              ? 'bg-gray-800 focus:bg-gray-700 border-gray-700'
              : 'bg-white focus:bg-gray-50 border-gray-200'
          } border focus:outline-none focus:ring-2 ${
            theme === 'dark' ? 'focus:ring-gray-600' : 'focus:ring-gray-200'
          } transition-all duration-300`}
        >
          <option value="">All dates</option>
          {dates.map(date => (
            <option key={date} value={date}>
              {format(new Date(date), 'MMM d, yyyy')}
            </option>
          ))}
        </select>
        <FiCalendar 
          className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`} 
          size={20} 
        />
      </div>
    </div>
  );
}