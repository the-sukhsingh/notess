'use client';

import { FiEdit2, FiTrash2, FiMove } from 'react-icons/fi';
import { useTheme } from 'next-themes';
import { format } from 'date-fns';

export default function NoteCard({ note, onEdit, onDelete }) {
  const { theme } = useTheme();
  const lastModified = note.content?.lastModified || note.createdAt;

  const getPreviewText = () => {
    if (!note.content?.blocks) return '';
    const textBlocks = note.content.blocks.filter(block => block.type === 'header' || block.type === 'paragraph');
    return textBlocks.length > 0 ? textBlocks[0].data.text : '';
  };

  return (
    <div 
      className={`group relative overflow-hidden rounded-xl border h-full ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
          : 'bg-white border-gray-200 hover:border-gray-300'
      } transition-all duration-300 ease-in-out hover:shadow-lg`}
    >

      <div className="p-4 sm:p-6 flex flex-col h-full">
        <div className="mb-3 sm:mb-4 mt-2">
          <h3 className="text-lg sm:text-xl font-serif mb-1 sm:mb-2 line-clamp-1 pr-16">{note.title}</h3>
          <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {format(new Date(lastModified), 'MMM d, yyyy')}
          </p>
        </div>
        
        <p className={`text-sm sm:text-base line-clamp-3 mb-3 sm:mb-4 flex-grow ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {getPreviewText()}
        </p>

        <div className="flex justify-end space-x-1 sm:space-x-2">
          <button
            onClick={() => onEdit(note)}
            className={`p-2 rounded-full ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-100'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
            } transition-colors duration-200 touch-device:opacity-100`}
            aria-label="Edit note"
          >
            <FiEdit2 size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className={`p-2 rounded-full ${
              theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400'
                : 'hover:bg-gray-100 text-gray-500 hover:text-red-500'
            } transition-colors duration-200 touch-device:opacity-100`}
            aria-label="Delete note"
          >
            <FiTrash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}