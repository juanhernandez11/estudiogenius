import React, { useState, useEffect, useRef } from 'react';
import { Note } from '../types';
import { Button } from './Button';
import { Modal } from './Modal';
import { ChevronLeft, Save, Plus, Bold, Italic, List, Code } from 'lucide-react';

interface NoteEditorProps {
  noteToEdit?: Note;
  availableSubjects: string[];
  onAddSubject: (subject: string) => void;
  onSave: (note: Omit<Note, 'id' | 'createdAt' | 'lastModified'> & { id?: string }) => void;
  onCancel: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({ noteToEdit, availableSubjects, onAddSubject, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState<string>(availableSubjects[0] || 'General');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // New Subject Modal State
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title);
      setContent(noteToEdit.content);
      setSubject(noteToEdit.subject);
    }
  }, [noteToEdit]);

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    onSave({
      id: noteToEdit?.id,
      title,
      content,
      subject,
    });
  };

  const handleCreateSubject = () => {
      if (newSubjectName.trim()) {
          onAddSubject(newSubjectName.trim());
          setSubject(newSubjectName.trim());
          setNewSubjectName('');
          setShowSubjectModal(false);
      }
  }

  const insertFormat = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    
    setContent(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  return (
    <>
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 pt-safe">
            <Button variant="ghost" size="icon" onClick={onCancel}>
            <ChevronLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {noteToEdit ? 'Editar Apunte' : 'Nuevo Apunte'}
            </h1>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={!title.trim() || !content.trim()}>
            <Save className="w-5 h-5 sm:hidden" />
            <span className="hidden sm:inline">Guardar</span>
            </Button>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto pb-safe">
            <div className="flex-shrink-0">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Asignatura
            </label>
            <div className="flex overflow-x-auto no-scrollbar gap-2 py-1 items-center">
                {availableSubjects.map((subj) => (
                <button
                    key={subj}
                    onClick={() => setSubject(subj)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    subject === subj 
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500' 
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                    }`}
                >
                    {subj}
                </button>
                ))}
                
                <button
                    onClick={() => setShowSubjectModal(true)}
                    className="flex-shrink-0 px-2 py-1.5 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 flex items-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
            </div>

            <div className="flex-shrink-0">
            <input
                type="text"
                placeholder="Título del apunte..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-2xl font-bold bg-transparent border-none placeholder-slate-300 dark:placeholder-slate-600 focus:ring-0 px-0 text-slate-900 dark:text-slate-100"
            />
            </div>

            {/* Formatting Toolbar */}
            <div className="flex-shrink-0 flex gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => insertFormat('**', '**')}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                    title="Negrita"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    onClick={() => insertFormat('*', '*')}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                    title="Cursiva"
                >
                    <Italic className="w-4 h-4" />
                </button>
                <button
                    onClick={() => insertFormat('\n- ')}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                    title="Lista"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    onClick={() => insertFormat('`', '`')}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
                    title="Código"
                >
                    <Code className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 flex flex-col min-h-[50vh]">
            <textarea
                ref={textareaRef}
                placeholder="Escribe tus notas aquí...\n\nUsa los botones de formato:\n**negrita** *cursiva* \`código\`"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 w-full bg-transparent border-none text-base leading-relaxed text-slate-700 dark:text-slate-300 placeholder-slate-300 dark:placeholder-slate-600 focus:ring-0 px-0 resize-none"
            />
            </div>
            
            <div className="h-12 sm:hidden shrink-0" /> 
        </div>
        </div>

        {/* New Subject Modal */}
        <Modal
            isOpen={showSubjectModal}
            onClose={() => setShowSubjectModal(false)}
            title="Nueva Asignatura"
        >
            <div className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Agrega una nueva materia a tu lista.</p>
                <input 
                    type="text"
                    autoFocus
                    placeholder="Nombre de la materia (ej. Anatomía)"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSubject()}
                />
                <Button className="w-full" onClick={handleCreateSubject} disabled={!newSubjectName.trim()}>
                    Agregar Materia
                </Button>
            </div>
        </Modal>
    </>
  );
};