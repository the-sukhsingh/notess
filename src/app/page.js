'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import NotesGrid from './components/NotesGrid';
import { getAllNotes, saveNote, deleteNote, registerSync } from './services/db';

const Editor = dynamic(() => import('./components/Editor'), { ssr: false });

export default function Home() {
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  // Load notes on component mount
  useEffect(() => {
    const loadNotes = async () => {
      try {
        setIsLoading(true);
        const savedNotes = await getAllNotes();
        setNotes(savedNotes || []);
      } catch (error) {
        console.error('Error loading notes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Load notes immediately
    loadNotes();

    // Set up service worker and sync
    const setupServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          await registerSync();
        } catch (error) {
          console.error('Service worker registration failed:', error);
        }
      }
    };

    setupServiceWorker();
  }, []);

  const handleEditorChange = async (data) => {
    if (!currentNote) return;
    
    const hasContent = data.blocks && data.blocks.length > 0 && data.blocks.some(block => {
      return block.data && block.data.text && block.data.text.trim().length > 0;
    });

    if (!hasContent) return;

    try {
      const updatedNote = {
        ...currentNote,
        title: data.title || 'New Note',
        content: data
      };

      await saveNote(updatedNote);
      const allNotes = await getAllNotes();
      setNotes(allNotes);
    } catch (error) {
      console.error('Error saving note:', error);
      // The note will still be saved locally due to IndexedDB
    }
  };

  const handleNewNote = async () => {
    try {
      const newNote = {
        id: uuidv4(),
        title: 'New Note',
        content: { blocks: [] },
        createdAt: new Date().toISOString(),
      };
      await saveNote(newNote);
      const allNotes = await getAllNotes();
      setNotes(allNotes);
      setCurrentNote(newNote);
      setIsEditing(true);
    } catch (error) {
      console.error('Error creating new note:', error);
      // Still create the note in UI as it will be saved locally
      setNotes(prev => [...prev, newNote]);
      setCurrentNote(newNote);
      setIsEditing(true);
    }
  };

  const handleEditNote = (note) => {
    setCurrentNote(note);
    setIsEditing(true);
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteNote(noteId);
      const allNotes = await getAllNotes();
      setNotes(allNotes);
      if (currentNote?.id === noteId) {
        setCurrentNote(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      // Remove from UI even if network error as it's deleted locally
      setNotes(prev => prev.filter(note => note.id !== noteId));
      if (currentNote?.id === noteId) {
        setCurrentNote(null);
        setIsEditing(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-current mx-auto mb-4"></div>
          <p>Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <main className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} pb-16`}>
      {isEditing ? (
        <div className="relative">
          <div className="fixed top-0 left-0 right-0 z-40 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <button
                onClick={() => setIsEditing(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white' 
                    : 'bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                } transition-colors duration-200 shadow-sm`}
              >
                ← Back to Notes
              </button>
            </div>
          </div>
          <Editor 
            key={currentNote?.id} 
            onChange={handleEditorChange}
            data={currentNote?.content}
          />
        </div>
      ) : (
        <NotesGrid
          notes={notes}
          onNewNote={handleNewNote}
          onEditNote={handleEditNote}
          onDeleteNote={handleDeleteNote}
        />
      )}
    </main>
  );
}
