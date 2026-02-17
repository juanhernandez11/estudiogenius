import React, { useState } from 'react';
import { Note } from '../types';
import { Search, BookOpen, Clock, Bell } from 'lucide-react';

interface NoteListProps {
  notes: Note[];
  availableSubjects: string[];
  onSelectNote: (note: Note) => void;
}

export const NoteList: React.FC<NoteListProps> = ({ notes, availableSubjects, onSelectNote }) => {
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(search.toLowerCase()) || 
                          note.content.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || note.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  }).sort((a, b) => b.lastModified - a.lastModified);

  const notesToReview = notes.filter(n => n.nextReview && n.nextReview <= Date.now()).length;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 pb-24">
      <div className="px-5 pt-8 pb-4 bg-white dark:bg-slate-800 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mis Apuntes</h1>
          {notesToReview > 0 && (
            <div className="flex items-center space-x-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold">
              <Bell className="w-3 h-3" />
              <span>{notesToReview}</span>
            </div>
          )}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{notes.length} notas guardadas</p>
        
        {/* Search */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border-none rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm"
            placeholder="Buscar apuntes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
          <button
            onClick={() => setSelectedSubject('All')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              selectedSubject === 'All' 
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' 
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            Todos
          </button>
          {availableSubjects.map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                selectedSubject === subj 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No se encontraron apuntes</p>
                <p className="text-slate-400 text-sm mt-1">Intenta crear uno nuevo o cambia el filtro</p>
            </div>
        ) : (
            filteredNotes.map(note => (
            <div 
                key={note.id}
                onClick={() => onSelectNote(note)}
                className={`bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border active:scale-[0.98] transition-transform cursor-pointer ${
                  note.nextReview && note.nextReview <= Date.now() 
                    ? 'border-amber-300 bg-amber-50/30 dark:bg-amber-900/20' 
                    : 'border-slate-100 dark:border-slate-700'
                }`}
            >
                <div className="flex justify-between items-start mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                        {note.subject}
                    </span>
                    <div className="flex items-center text-xs text-slate-400 dark:text-slate-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(note.lastModified).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1 line-clamp-1">{note.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 leading-relaxed">
                    {note.summary ? `✨ ${note.summary}` : note.content}
                </p>
            </div>
            ))
        )}
      </div>
    </div>
  );
};