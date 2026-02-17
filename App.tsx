import React, { useState, useEffect, useCallback } from 'react';
import { Note, ViewState, Notification as NotificationType, DEFAULT_SUBJECTS, AppSettings } from './types';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { NoteDetail } from './components/NoteDetail';
import { NavBar } from './components/NavBar';
import { Settings } from './components/Settings';
import { NotificationToast } from './components/Notification';
import { Login } from './components/Login';
import { v4 as uuidv4 } from 'uuid';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';

const SETTINGS_KEY = 'study_genius_settings';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>('LIST');
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : { darkMode: false };
  });
  
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationType | null>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ id: uuidv4(), message, type });
  }, []);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load notes from Firestore
  useEffect(() => {
    if (!user) return;
    
    const loadNotes = async () => {
      try {
        const notesRef = collection(db, 'users', user.uid, 'notes');
        const snapshot = await getDocs(notesRef);
        const loadedNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
        setNotes(loadedNotes);
      } catch (e) {
        console.error('Error loading notes:', e);
        showNotification('Error al cargar notas de la nube', 'error');
      }
    };

    const loadSubjects = async () => {
      try {
        const subjectsDoc = await getDocs(collection(db, 'users', user.uid, 'settings'));
        const settingsData = subjectsDoc.docs[0]?.data();
        if (settingsData?.subjects) {
          setSubjects(settingsData.subjects);
        }
      } catch (e) {
        console.error('Error loading subjects:', e);
      }
    };
    
    loadNotes();
    loadSubjects();
  }, [user, showNotification]);

  // Save notes to Firestore
  const saveNoteToFirestore = async (note: Note) => {
    if (!user) return;
    try {
      const noteRef = doc(db, 'users', user.uid, 'notes', note.id);
      await setDoc(noteRef, note);
    } catch (e) {
      console.error('Error saving to Firestore:', e);
      showNotification('Error al sincronizar con la nube', 'error');
    }
  };

  // Save settings
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  // Check for notes to review
  useEffect(() => {
    const notifiedNotes = new Map<string, number>();
    
    const checkReviews = () => {
      const now = Date.now();
      const reminderWindow = 15 * 60 * 1000;
      
      notes.forEach(note => {
        if (!note.nextReview) return;
        
        if (notifiedNotes.has(note.id) && notifiedNotes.get(note.id) !== note.nextReview) {
          notifiedNotes.delete(note.id);
        }
        
        if (notifiedNotes.has(note.id)) return;
        
        const timeUntilReview = note.nextReview - now;
        
        if (timeUntilReview <= reminderWindow && timeUntilReview >= -5 * 60 * 1000) {
          notifiedNotes.set(note.id, note.nextReview);
          
          const minutesLeft = Math.round(timeUntilReview / 60000);
          const message = minutesLeft > 0 
            ? `Repasa "${note.title}" en ${minutesLeft} minutos`
            : `Es hora de repasar "${note.title}"`;
          
          showNotification(message, 'info');
          
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('EstudioGenius - Recordatorio', {
              body: message,
              icon: '/img/Gemini_Generated_Image_s5ygros5ygros5yg.png'
            });
          }
        }
      });
    };

    const timer = setTimeout(checkReviews, 1000);
    const interval = setInterval(checkReviews, 2 * 60 * 1000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [notes, showNotification]);

  const handleAddSubject = async (newSubject: string) => {
    if (!subjects.includes(newSubject)) {
      const updatedSubjects = [...subjects, newSubject];
      setSubjects(updatedSubjects);
      
      if (user) {
        try {
          await setDoc(doc(db, 'users', user.uid, 'settings', 'subjects'), { subjects: updatedSubjects });
        } catch (e) {
          console.error('Error saving subjects:', e);
        }
      }
      
      showNotification(`Materia "${newSubject}" agregada`, "success");
    }
  };

  const handleSaveNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'lastModified'> & { id?: string }) => {
    const now = Date.now();
    
    if (noteData.id) {
      const updatedNote = { ...notes.find(n => n.id === noteData.id)!, ...noteData, lastModified: now, id: noteData.id };
      setNotes(prev => prev.map(n => n.id === noteData.id ? updatedNote : n));
      await saveNoteToFirestore(updatedNote);
      showNotification("Apunte actualizado", "success");
    } else {
      const newNote: Note = {
        id: uuidv4(),
        createdAt: now,
        lastModified: now,
        title: noteData.title,
        content: noteData.content,
        subject: noteData.subject,
        nextReview: now + 24 * 60 * 60 * 1000,
        reviewCount: 0
      };
      setNotes(prev => [newNote, ...prev]);
      await saveNoteToFirestore(newNote);
      showNotification("Apunte creado", "success");
    }
    setView('LIST');
    setSelectedNoteId(null);
  };

  const handleDeleteNote = async () => {
    if (selectedNoteId) {
      if (user) {
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'notes', selectedNoteId));
        } catch (e) {
          console.error('Error deleting from Firestore:', e);
          showNotification('Error al eliminar de la nube', 'error');
          return;
        }
      }
      setNotes(prev => prev.filter(n => n.id !== selectedNoteId));
      setView('LIST');
      setSelectedNoteId(null);
      showNotification("Apunte eliminado", "info");
    }
  };

  const handleClearAll = async () => {
    if (user) {
      try {
        const notesRef = collection(db, 'users', user.uid, 'notes');
        const snapshot = await getDocs(notesRef);
        await Promise.all(snapshot.docs.map(doc => deleteDoc(doc.ref)));
      } catch (e) {
        console.error('Error deleting from Firestore:', e);
        showNotification('Error al eliminar de la nube', 'error');
        return;
      }
    }
    setNotes([]);
    showNotification("Todos los apuntes han sido eliminados", "info");
    setView('LIST');
  };

  const handleSelectNote = (note: Note) => {
      setSelectedNoteId(note.id);
      setView('DETAIL');
  }

  const handleUpdateNote = async (updatedNote: Note) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    await saveNoteToFirestore(updatedNote);
  };

  const handleToggleDarkMode = () => {
    setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const handleImportNotes = (imported: Note[]) => {
    setNotes(prev => [...imported, ...prev]);
    showNotification(`${imported.length} notas importadas`, 'success');
  };

  const handleDeleteSubject = async (subject: string) => {
    const notesWithSubject = notes.filter(n => n.subject === subject).length;
    if (notesWithSubject > 0) {
      if (!confirm(`Hay ${notesWithSubject} nota(s) con esta materia. ¿Eliminar de todos modos?`)) return;
    }
    
    if (DEFAULT_SUBJECTS.includes(subject)) {
      showNotification('No puedes eliminar materias predeterminadas', 'error');
      return;
    }
    
    const updatedSubjects = subjects.filter(s => s !== subject);
    setSubjects(updatedSubjects);
    
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'settings', 'subjects'), { subjects: updatedSubjects });
      } catch (e) {
        console.error('Error deleting subject:', e);
      }
    }
    
    showNotification(`Materia "${subject}" eliminada`, 'info');
  };

  const handleLogout = async () => {
    await auth.signOut();
    setNotes([]);
    setView('LIST');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    try {
      const notesRef = collection(db, 'users', user.uid, 'notes');
      const snapshot = await getDocs(notesRef);
      await Promise.all(snapshot.docs.map(doc => deleteDoc(doc.ref)));
      
      const settingsRef = collection(db, 'users', user.uid, 'settings');
      const settingsSnapshot = await getDocs(settingsRef);
      await Promise.all(settingsSnapshot.docs.map(doc => deleteDoc(doc.ref)));
      
      await user.delete();
      
      setNotes([]);
      setView('LIST');
      showNotification('Cuenta eliminada exitosamente', 'info');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/requires-recent-login') {
        showNotification('Debes iniciar sesión nuevamente para eliminar tu cuenta', 'error');
        await auth.signOut();
      } else {
        showNotification('Error al eliminar la cuenta', 'error');
      }
    }
  };

  const renderView = () => {
    switch (view) {
      case 'LIST':
        return <NoteList notes={notes} availableSubjects={subjects} onSelectNote={handleSelectNote} />;
      case 'CREATE':
        return <NoteEditor availableSubjects={subjects} onAddSubject={handleAddSubject} onSave={handleSaveNote} onCancel={() => setView('LIST')} />;
      case 'EDIT':
        const noteToEdit = notes.find(n => n.id === selectedNoteId);
        return noteToEdit 
            ? <NoteEditor noteToEdit={noteToEdit} availableSubjects={subjects} onAddSubject={handleAddSubject} onSave={handleSaveNote} onCancel={() => setView('DETAIL')} />
            : <div className="p-4 text-center">Error: Nota no encontrada</div>;
      case 'DETAIL':
        const noteDetail = notes.find(n => n.id === selectedNoteId);
        return noteDetail
            ? <NoteDetail note={noteDetail} onBack={() => setView('LIST')} onEdit={() => setView('EDIT')} onDelete={handleDeleteNote} onUpdateNote={handleUpdateNote} showNotification={showNotification} />
            : <div className="p-4 text-center">Error: Nota no encontrada</div>;
      case 'SETTINGS':
        return <Settings onClearAll={handleClearAll} darkMode={settings.darkMode} onToggleDarkMode={handleToggleDarkMode} notes={notes} onImportNotes={handleImportNotes} subjects={subjects} onDeleteSubject={handleDeleteSubject} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} />;
      default:
        return <NoteList notes={notes} availableSubjects={subjects} onSelectNote={handleSelectNote} />;
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <div className={`h-screen w-full ${settings.darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans mx-auto max-w-md shadow-2xl overflow-hidden relative`}>
      {notification && (
        <NotificationToast notification={notification} onClose={() => setNotification(null)} />
      )}
      
      <main className="h-full w-full">
        {renderView()}
      </main>
      
      {(view === 'LIST' || view === 'CREATE' || view === 'SETTINGS') && (
        <NavBar currentView={view} onChangeView={setView} />
      )}
    </div>
  );
}

export default App;
