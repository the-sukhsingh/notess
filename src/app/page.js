'use client';

import { useState, useEffect } from 'react';
import Editor from './components/Editor';
import ThemeSwitch from './components/ThemeSwitch';
import NotesGrid from './components/NotesGrid';
import { v4 as uuidv4 } from 'uuid';
import { useTheme } from 'next-themes';

export default function Home() {
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  const saveNotes = (updatedNotes) => {
    setNotes(updatedNotes);
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
  };

  useEffect(() => {
    if (!isEditing && currentNote) {
      console.log("All notes", notes);
      const filteredNotes = notes.filter(note => {
        const hasContent = note.content && note.content.blocks && note.content.blocks.length > 0;
        return hasContent;
      });
      console.log("Filtered notes", filteredNotes);
      setNotes(filteredNotes);
      localStorage.setItem('notes', JSON.stringify(filteredNotes));
    }
  }, [isEditing]);

  const handleEditorChange = (data) => {
    if (!currentNote) return;
    // Check if the note has any content
    const hasContent = data.blocks && data.blocks.length > 0 && data.blocks.some(block => {
      // Check if the block has any text content
      return block.data && block.data.text && block.data.text.trim().length > 0;
    });

    if (!hasContent) {
      // If there's no content, don't save the note
      return;
    }

    const updatedNotes = notes.map(note =>
      note.id === currentNote.id
        ? { ...note, title: data.title || 'New Note', content: data }
        : note
    );
    saveNotes(updatedNotes);
  };

  const handleNewNote = () => {
    const newNote = {
      id: uuidv4(),
      title: 'New Note',
      content: { blocks: [] },
      createdAt: new Date().toISOString(),
    };
    setCurrentNote(newNote);
    setIsEditing(true);
    saveNotes([...notes, newNote]);
  };

  const handleEditNote = (note) => {
    setCurrentNote(note);
    setIsEditing(true);
  };

  const handleDeleteNote = (noteId) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    saveNotes(updatedNotes);
    if (currentNote?.id === noteId) {
      setCurrentNote(null);
      setIsEditing(false);
    }
  };

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
      <div className="fixed bottom-0 right-0 left-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <span
            className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
          >Made By Sukhjit Singh with 💖</span>
          <ThemeSwitch />
        </div>
      </div>
    </main>
  );
}
