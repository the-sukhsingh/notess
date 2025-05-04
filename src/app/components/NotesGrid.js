'use client';

import { FiPlus } from 'react-icons/fi';
import NoteCard from './NoteCard';
import SearchBar from './SearchBar';
import DatePicker from './DatePicker';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { startOfDay, isSameDay } from 'date-fns';
import ThemeSwitch from './ThemeSwitch';

export default function NotesGrid({ notes, onNewNote, onEditNote, onDeleteNote }) {
  const [sortedNotes, setSortedNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const { theme } = useTheme();

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Set initial state
    setIsOffline(!navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get unique dates from notes
  const uniqueDates = [...new Set(notes.map(note => {
    const date = new Date((note.content?.lastModified || note.createdAt));
    return startOfDay(date).toISOString();
  }))].sort((a, b) => new Date(b) - new Date(a));

  useEffect(() => {
    const sorted = [...notes].sort((a, b) => {
      const dateA = new Date((a.content?.lastModified || a.createdAt));
      const dateB = new Date((b.content?.lastModified || b.createdAt));
      return dateB - dateA; // Sort by last modified date, most recent first
    });
    setSortedNotes(sorted);
  }, [notes]);

  const filteredNotes = sortedNotes.filter(note => {
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = note.title?.toLowerCase().includes(searchLower);
    const contentMatch = note.content?.blocks?.some(block => 
      block.type === 'paragraph' && block.data.text?.toLowerCase().includes(searchLower)
    );
    const dateMatch = selectedDate ? 
      isSameDay(new Date(note.content?.lastModified || note.createdAt), new Date(selectedDate)) : 
      true;
    
    return (titleMatch || contentMatch) && dateMatch;
  });

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="space-y-6">

        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <h1 className="text-3xl sm:text-4xl font-serif italic">Notes</h1>
          <div className={`flex items-center justify-between space-x-4`}>
            <ThemeSwitch />
            <button
              onClick={onNewNote}
              className={`group flex items-center justify-center gap-3 px-6 py-3 rounded-full ${
                theme === 'dark' 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-100' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              } transition-all duration-300 ease-in-out shadow-sm hover:shadow`}
            >
              <FiPlus size={20} className="transition-transform group-hover:rotate-90 duration-300" />
              <span className="font-medium">Add Note</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="w-full sm:flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <DatePicker
            dates={uniqueDates}
            selectedDate={selectedDate}
            onChange={setSelectedDate}
          />
        </div>
        
        {filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <div key={note.id}>
                <NoteCard
                  note={note}
                  onEdit={onEditNote}
                  onDelete={onDeleteNote}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 sm:py-20 text-gray-500">
            <p className="text-lg sm:text-xl mb-2 sm:mb-4">
              {searchQuery || selectedDate ? 'No matching notes found' : 'No notes yet'}
            </p>
            <p className="text-sm">
              {searchQuery || selectedDate ? 'Try different filters' : 'Create your first note to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}