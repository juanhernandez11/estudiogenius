import React, { useState, useEffect, useCallback } from 'react';
import { Note, ViewState, Notification as NotificationType, DEFAULT_SUBJECTS, AppSettings, UserFeedback, StudyProgress, StudyResult } from './types';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { NoteDetail } from './components/NoteDetail';
import { NavBar } from './components/NavBar';
import { Settings } from './components/Settings';
import { StudyHub } from './components/StudyHub';
import { NotificationToast } from './components/Notification';
import { Login } from './components/Login';
import { Onboarding } from './components/Onboarding';
import { v4 as uuidv4 } from 'uuid';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { addDoc, collection, doc, setDoc, getDocs, getDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

const SETTINGS_KEY = 'study_genius_settings';
const ONBOARDING_KEY = 'study_genius_onboarding_done';
const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  notificationsEnabled: false,
  studyDuration: 10,
  studyPriority: 'balanced',
  studySubjects: [],
  weeklyStudyGoal: 3,
};

const getLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [notesOwnerUid, setNotesOwnerUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [view, setView] = useState<ViewState>('LIST');
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS);
  const [studyProgress, setStudyProgress] = useState<StudyProgress>({ currentStreak: 0, lastStudyDate: null });
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      const parsed = saved ? JSON.parse(saved) as Partial<AppSettings> : {};
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        studyDuration: parsed.studyDuration === 5 || parsed.studyDuration === 15 ? parsed.studyDuration : 10,
        studyPriority: parsed.studyPriority === 'due' || parsed.studyPriority === 'weak' || parsed.studyPriority === 'new' ? parsed.studyPriority : 'balanced',
        studySubjects: Array.isArray(parsed.studySubjects) ? parsed.studySubjects.filter((subject): subject is string => typeof subject === 'string') : [],
        weeklyStudyGoal: parsed.weeklyStudyGoal === 5 || parsed.weeklyStudyGoal === 7 ? parsed.weeklyStudyGoal : 3,
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationType | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(() => !!localStorage.getItem(ONBOARDING_KEY));

  const handleOnboardingFinish = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setOnboardingDone(true);
  };

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ id: uuidv4(), message, type });
  }, []);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setNotesOwnerUid(currentUser?.uid || null);
      if (currentUser) {
        try {
          const cachedNotes = localStorage.getItem(`study_genius_notes_${currentUser.uid}`);
          const parsedNotes: unknown = cachedNotes ? JSON.parse(cachedNotes) : [];
          setNotes(Array.isArray(parsedNotes) ? parsedNotes as Note[] : []);
        } catch (error) {
          console.error('Error loading local notes cache:', error);
          setNotes([]);
        }
      } else {
        setNotes([]);
        setStudyProgress({ currentStreak: 0, lastStudyDate: null });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
    };
  }, []);

  useEffect(() => {
    if (!user || notesOwnerUid !== user.uid) return;
    try {
      localStorage.setItem(`study_genius_notes_${user.uid}`, JSON.stringify(notes));
    } catch (error) {
      console.error('Error saving local notes cache:', error);
      showNotification('No se pudieron guardar tus apuntes para consulta sin conexión.', 'error');
    }
  }, [notes, notesOwnerUid, showNotification, user]);

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
        const subjectsDoc = await getDoc(doc(db, 'users', user.uid, 'settings', 'subjects'));
        const settingsData = subjectsDoc.data();
        if (settingsData?.subjects) {
          setSubjects(settingsData.subjects);
        }
      } catch (e) {
        console.error('Error loading subjects:', e);
      }
    };

    const loadStudyProgress = async () => {
      try {
        const progressDoc = await getDoc(doc(db, 'users', user.uid, 'settings', 'progress'));
        const progress = progressDoc.data();
        if (progress && typeof progress.currentStreak === 'number') {
          setStudyProgress({
            currentStreak: progress.currentStreak,
            lastStudyDate: typeof progress.lastStudyDate === 'string' ? progress.lastStudyDate : null,
            studyDates: Array.isArray(progress.studyDates)
              ? progress.studyDates.filter((date: unknown): date is string => typeof date === 'string').slice(-365)
              : typeof progress.lastStudyDate === 'string' ? [progress.lastStudyDate] : [],
          });
        }
      } catch (e) {
        console.error('Error loading study progress:', e);
      }
    };
    
    loadNotes();
    loadSubjects();
    loadStudyProgress();
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

  useEffect(() => {
    if (
      settings.notificationsEnabled &&
      (!('Notification' in window) || Notification.permission !== 'granted')
    ) {
      setSettings(prev => ({ ...prev, notificationsEnabled: false }));
    }
  }, [settings.notificationsEnabled]);

  // Check for notes to review
  useEffect(() => {
    const notifiedNotes = new Map<string, number>();
    
    const checkReviews = () => {
      if (!settings.notificationsEnabled) return;
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
  }, [notes, settings.notificationsEnabled, showNotification]);

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

  const handleStudyActivity = async () => {
    const today = getLocalDateKey(new Date());
    if (studyProgress.lastStudyDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const continuesStreak = studyProgress.lastStudyDate === getLocalDateKey(yesterday);
    const dayGap = studyProgress.lastStudyDate
      ? Date.parse(`${today}T12:00:00`) - Date.parse(`${studyProgress.lastStudyDate}T12:00:00`)
      : Number.POSITIVE_INFINITY;
    const hasGraceDay = dayGap >= 0 && dayGap <= 2 * 24 * 60 * 60 * 1000;
    const nextProgress: StudyProgress = {
      currentStreak: continuesStreak || hasGraceDay ? studyProgress.currentStreak + 1 : 1,
      lastStudyDate: today,
      studyDates: [...new Set([...(studyProgress.studyDates || []), today])].slice(-365),
    };
    setStudyProgress(nextProgress);
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'settings', 'progress'), nextProgress);
      } catch (error) {
        console.error('Error saving study progress:', error);
        showNotification('No se pudo guardar tu racha de estudio.', 'error');
      }
    }
  };

  const handleStudyResults = async (results: StudyResult[]) => {
    const now = Date.now();
    const updates = results.flatMap(result => {
      const note = notes.find(candidate => candidate.id === result.noteId);
      if (!note) return [];
      return [{
        ...note,
        quizAttempts: (note.quizAttempts || 0) + result.total,
        quizCorrect: (note.quizCorrect || 0) + result.correct,
        lastStudiedAt: now,
        failedQuestions: [
          ...(note.failedQuestions || []).filter(question => !result.resolvedQuestionIds.includes(question.id)),
          ...result.failedQuestions.filter(question =>
            !note.failedQuestions?.some(existing => existing.id === question.id) &&
            !result.resolvedQuestionIds.includes(question.id)
          ),
        ].slice(-50),
      }];
    });

    if (updates.length) {
      setNotes(previous => previous.map(note => updates.find(update => update.id === note.id) || note));
      await Promise.all(updates.map(saveNoteToFirestore));
      await handleStudyActivity();
    }
  };

  const handleToggleDarkMode = () => {
    setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const handleUpdateStudyPreferences = (preferences: Pick<AppSettings, 'studyDuration' | 'studyPriority' | 'studySubjects' | 'weeklyStudyGoal'>) => {
    setSettings(previous => ({ ...previous, ...preferences }));
  };

  const handleReportQuestion = (question: string, sourceTitle: string) => {
    void handleSubmitFeedback({
      category: 'problem',
      rating: 2,
      message: `Pregunta dudosa del apunte "${sourceTitle}": ${question}`.slice(0, 2000),
    }).catch(() => undefined);
  };

  const handleToggleNotifications = async () => {
    if (settings.notificationsEnabled) {
      setSettings(prev => ({ ...prev, notificationsEnabled: false }));
      return;
    }

    if (!('Notification' in window)) {
      showNotification('Este navegador no admite notificaciones.', 'error');
      return;
    }

    try {
      const permission = Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission;
      if (permission !== 'granted') {
        showNotification('No se activaron las notificaciones. Revisa los permisos del navegador.', 'info');
        return;
      }
      setSettings(prev => ({ ...prev, notificationsEnabled: true }));
      showNotification('Notificaciones de repaso activadas.', 'success');
    } catch {
      showNotification('No se pudo solicitar permiso para las notificaciones.', 'error');
    }
  };

  const handleImportNotes = async (imported: Note[]) => {
    if (imported.length > 450) {
      showNotification('Importa un máximo de 450 notas a la vez.', 'error');
      return;
    }

    const existingIds = new Set(notes.map(note => note.id));
    const notesToImport = imported.map(note => {
      const id = note.id && !existingIds.has(note.id) ? note.id : uuidv4();
      existingIds.add(id);
      return { ...note, id };
    });

    if (user && notesToImport.length) {
      try {
        const batch = writeBatch(db);
        notesToImport.forEach(note => {
          batch.set(doc(db, 'users', user.uid, 'notes', note.id), note);
        });
        await batch.commit();
      } catch (error) {
        console.error('Error importing notes to Firestore:', error);
        showNotification('No se pudieron guardar las notas importadas.', 'error');
        return;
      }
    }

    setNotes(prev => [...notesToImport, ...prev]);
    showNotification(`${notesToImport.length} notas importadas`, 'success');
  };

  const handleSubmitFeedback = async (feedback: UserFeedback) => {
    if (!user) throw new Error('Inicia sesión para enviar comentarios.');
    try {
      await addDoc(collection(db, 'users', user.uid, 'feedback'), {
        ...feedback,
        createdAt: serverTimestamp(),
      });
      showNotification('Gracias por compartir tu opinión.', 'success');
    } catch (error) {
      console.error('Error saving feedback:', error);
      showNotification('No se pudo enviar tu opinión. Inténtalo de nuevo.', 'error');
      throw error;
    }
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
    setSettings(previous => ({ ...previous, studySubjects: previous.studySubjects.filter(value => value !== subject) }));
    
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

      const feedbackRef = collection(db, 'users', user.uid, 'feedback');
      const feedbackSnapshot = await getDocs(feedbackRef);
      await Promise.all(feedbackSnapshot.docs.map(doc => deleteDoc(doc.ref)));
      
      await user.delete();
      localStorage.removeItem(`study_genius_notes_${user.uid}`);
      localStorage.removeItem(SETTINGS_KEY);
      setSettings(DEFAULT_SETTINGS);
      
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
      case 'STUDY':
        return <StudyHub notes={notes} streakDays={studyProgress.currentStreak} studyProgress={studyProgress} studyPreferences={settings} profileName={user.displayName || 'Estudiante'} profilePhoto={user.photoURL} onOpenSettings={() => setView('SETTINGS')} onCreateNote={() => setView('CREATE')} onStudyComplete={results => { void handleStudyResults(results); }} onReportQuestion={handleReportQuestion} />;
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
            ? <NoteDetail note={noteDetail} onBack={() => setView('LIST')} onEdit={() => setView('EDIT')} onDelete={handleDeleteNote} onUpdateNote={handleUpdateNote} showNotification={showNotification} notificationsEnabled={settings.notificationsEnabled} onStudyActivity={() => { void handleStudyActivity(); }} onReportQuestion={handleReportQuestion} />
            : <div className="p-4 text-center">Error: Nota no encontrada</div>;
      case 'SETTINGS':
        return <Settings onClearAll={handleClearAll} darkMode={settings.darkMode} onToggleDarkMode={handleToggleDarkMode} notificationsEnabled={settings.notificationsEnabled} notificationPermission={'Notification' in window ? Notification.permission : 'unsupported'} onToggleNotifications={handleToggleNotifications} notes={notes} onImportNotes={handleImportNotes} onSubmitFeedback={handleSubmitFeedback} subjects={subjects} onDeleteSubject={handleDeleteSubject} studyPreferences={settings} onUpdateStudyPreferences={handleUpdateStudyPreferences} onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} />;
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

  if (!onboardingDone) {
    return <Onboarding onFinish={handleOnboardingFinish} />;
  }

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  return (
    <div className={`h-[100dvh] min-h-[100svh] w-full ${settings.darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans mx-auto max-w-7xl shadow-2xl overflow-hidden relative`}>
      {notification && (
        <NotificationToast notification={notification} onClose={() => setNotification(null)} />
      )}
      {!isOnline && (
        <div role="status" className="absolute left-0 right-0 top-0 z-30 bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900 dark:bg-amber-900 dark:text-amber-100">
          Sin conexión: puedes consultar los apuntes guardados en este dispositivo; la IA y sincronización requieren internet.
        </div>
      )}
      
      <main className="h-full w-full lg:pl-64">
        {renderView()}
      </main>
      
      <NavBar
        currentView={view}
        onChangeView={setView}
        hideOnMobile={view === 'DETAIL' || view === 'EDIT'}
      />
    </div>
  );
}

export default App;
