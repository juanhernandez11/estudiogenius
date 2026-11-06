import React, { useEffect, useState } from 'react';
import { Stats } from './Stats';
import { Trash2, Shield, AlertTriangle, Moon, Sun, Download, Upload, X, LogOut, Bell, MessageSquare, Send, Smartphone } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';
import { AppSettings, Note, UserFeedback } from '../types';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let availableInstallPrompt: InstallPromptEvent | null = null;
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  availableInstallPrompt = event as InstallPromptEvent;
});

interface SettingsProps {
  onClearAll: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  notificationsEnabled: boolean;
  notificationPermission: NotificationPermission | 'unsupported';
  onToggleNotifications: () => void;
  notes: Note[];
  onImportNotes: (notes: Note[]) => Promise<void>;
  onSubmitFeedback: (feedback: UserFeedback) => Promise<void>;
  subjects: string[];
  onDeleteSubject: (subject: string) => void;
  studyPreferences: Pick<AppSettings, 'studyDuration' | 'studyPriority' | 'studySubjects' | 'weeklyStudyGoal'>;
  onUpdateStudyPreferences: (preferences: Pick<AppSettings, 'studyDuration' | 'studyPriority' | 'studySubjects' | 'weeklyStudyGoal'>) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

const isValidNote = (value: unknown): value is Note => {
  if (!value || typeof value !== 'object') return false;
  const note = value as Partial<Note>;
  const validQuiz = note.quiz === undefined || (
    Array.isArray(note.quiz) &&
    note.quiz.length <= 20 &&
    note.quiz.every(question =>
      typeof question.question === 'string' &&
      question.question.length <= 2000 &&
      typeof question.explanation === 'string' &&
      question.explanation.length <= 2000 &&
      Array.isArray(question.options) &&
      question.options.length === 4 &&
      question.options.every(option => typeof option === 'string' && option.length <= 500) &&
      Number.isInteger(question.correctAnswerIndex) &&
      question.correctAnswerIndex >= 0 &&
      question.correctAnswerIndex < question.options.length
    )
  );
  const validFailedQuestions = note.failedQuestions === undefined || (
    Array.isArray(note.failedQuestions) &&
    note.failedQuestions.length <= 50 &&
    note.failedQuestions.every(question =>
      typeof question.id === 'string' &&
      question.id.length > 0 &&
      question.id.length <= 200 &&
      typeof question.question === 'string' &&
      question.question.length <= 2000 &&
      typeof question.explanation === 'string' &&
      question.explanation.length <= 2000 &&
      Array.isArray(question.options) &&
      question.options.length === 4 &&
      question.options.every(option => typeof option === 'string' && option.length <= 500) &&
      Number.isInteger(question.correctAnswerIndex) &&
      question.correctAnswerIndex >= 0 &&
      question.correctAnswerIndex < question.options.length
    )
  );
  const isSmallEnough = new TextEncoder().encode(JSON.stringify(note)).length <= 900 * 1024;
  return typeof note.id === 'string' && note.id.length > 0 && note.id.length <= 200 && !note.id.includes('/') &&
    typeof note.title === 'string' && note.title.length <= 500 &&
    typeof note.content === 'string' && note.content.length <= 300000 &&
    typeof note.subject === 'string' && note.subject.length <= 200 &&
    typeof note.createdAt === 'number' && Number.isFinite(note.createdAt) &&
    typeof note.lastModified === 'number' && Number.isFinite(note.lastModified) &&
    (note.summary === undefined || (typeof note.summary === 'string' && note.summary.length <= 100000)) &&
    (note.nextReview === undefined || (typeof note.nextReview === 'number' && Number.isFinite(note.nextReview))) &&
    (note.reviewCount === undefined || (typeof note.reviewCount === 'number' && Number.isFinite(note.reviewCount) && note.reviewCount >= 0)) &&
    (note.quizAttempts === undefined || (typeof note.quizAttempts === 'number' && Number.isInteger(note.quizAttempts) && note.quizAttempts >= 0)) &&
    (note.quizCorrect === undefined || (typeof note.quizCorrect === 'number' && Number.isInteger(note.quizCorrect) && note.quizCorrect >= 0 && note.quizCorrect <= (note.quizAttempts || 0))) &&
    isSmallEnough &&
    validQuiz &&
    validFailedQuestions;
};

export const Settings: React.FC<SettingsProps> = ({
  onClearAll,
  darkMode,
  onToggleDarkMode,
  notificationsEnabled,
  notificationPermission,
  onToggleNotifications,
  notes,
  onImportNotes,
  onSubmitFeedback,
  subjects,
  onDeleteSubject,
  studyPreferences,
  onUpdateStudyPreferences,
  onLogout,
  onDeleteAccount,
}) => {
  const [showClearModal, setShowClearModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<UserFeedback['category']>('idea');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches);
  const [installError, setInstallError] = useState('');

  useEffect(() => {
    setInstallPrompt(availableInstallPrompt);
    const handleInstalled = () => {
      setIsInstalled(true);
      availableInstallPrompt = null;
      setInstallPrompt(null);
    };
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    setInstallError('');
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        availableInstallPrompt = null;
        setInstallPrompt(null);
      }
    } catch (error) {
      console.error('Error prompting PWA installation:', error);
      setInstallError('No se pudo iniciar la instalación. Usa el menú del navegador para instalarla.');
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estudiogenius-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo supera el límite de 10 MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported) && imported.length <= 450 && imported.every(isValidNote)) {
          void onImportNotes(imported);
        } else {
          alert('El archivo no contiene un respaldo válido o supera el límite de 450 notas.');
        }
      } catch {
        alert('Error al importar el archivo');
      }
    };
    reader.onerror = () => alert('No se pudo leer el archivo seleccionado.');
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleFeedbackSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!feedbackMessage.trim()) return;

    setFeedbackSubmitting(true);
    setFeedbackError('');
    try {
      await onSubmitFeedback({
        category: feedbackCategory,
        rating: feedbackRating,
        message: feedbackMessage.trim(),
      });
      setFeedbackMessage('');
      setFeedbackOpen(false);
    } catch {
      setFeedbackError('No se pudo enviar. Revisa tu conexión e inténtalo otra vez.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
        <div className="px-5 pt-8 pb-4 bg-white dark:bg-slate-800 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-700 pt-safe lg:px-8 lg:pt-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Ajustes</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 pb-32 lg:mx-auto lg:grid lg:w-full lg:max-w-5xl lg:grid-cols-2 lg:content-start lg:items-start lg:gap-6 lg:space-y-0 lg:p-8 lg:pb-10">
            
            {/* Stats */}
            <div className="lg:col-span-2">
                <Stats notes={notes} />
            </div>

            {/* Appearance */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4">Apariencia</h3>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        {darkMode ? <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" /> : <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" />}
                        <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Modo Oscuro</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Reduce el brillo de la pantalla</p>
                        </div>
                    </div>
                    <button
                        onClick={onToggleDarkMode}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            darkMode ? 'bg-indigo-600' : 'bg-slate-200'
                        }`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            darkMode ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </button>
                </div>
            </div>

            {/* Notifications */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4">Notificaciones</h3>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Recordatorios de repaso</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Avisos cuando la app esté abierta</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={notificationsEnabled}
                        aria-label="Activar notificaciones de repaso"
                        disabled={notificationPermission === 'unsupported' || notificationPermission === 'denied'}
                        onClick={onToggleNotifications}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'
                        }`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </button>
                </div>
                {notificationPermission === 'denied' && (
                    <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
                        El navegador bloqueó los avisos. Permítelos desde los ajustes del sitio para activarlos.
                    </p>
                )}
                {notificationPermission === 'unsupported' && (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        Este navegador no admite notificaciones del sistema.
                    </p>
                )}
            </div>

            {/* Backup */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-3">Preferencias de estudio</h3>
                <label htmlFor="study-duration" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Duración de la ruta</label>
                <select
                    id="study-duration"
                    name="studyDuration"
                    value={studyPreferences.studyDuration}
                    onChange={event => onUpdateStudyPreferences({ ...studyPreferences, studyDuration: Number(event.target.value) as AppSettings['studyDuration'] })}
                    className="mt-1 mb-4 block w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                    <option value={5}>5 minutos</option>
                    <option value={10}>10 minutos</option>
                    <option value={15}>15 minutos</option>
                </select>
                <label htmlFor="study-priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Priorizar</label>
                <select
                    id="study-priority"
                    name="studyPriority"
                    value={studyPreferences.studyPriority}
                    onChange={event => onUpdateStudyPreferences({ ...studyPreferences, studyPriority: event.target.value as AppSettings['studyPriority'] })}
                    className="mt-1 mb-4 block w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                    <option value="balanced">Repasos y temas débiles</option>
                    <option value="due">Repasos pendientes</option>
                    <option value="weak">Temas que más me cuestan</option>
                    <option value="new">Temas sin diagnóstico</option>
                </select>
                <label htmlFor="weekly-study-goal" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Meta semanal de estudio</label>
                <select
                    id="weekly-study-goal"
                    name="weeklyStudyGoal"
                    value={studyPreferences.weeklyStudyGoal}
                    onChange={event => onUpdateStudyPreferences({ ...studyPreferences, weeklyStudyGoal: Number(event.target.value) as AppSettings['weeklyStudyGoal'] })}
                    className="mt-1 mb-4 block w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                >
                    <option value={3}>3 días por semana</option>
                    <option value={5}>5 días por semana</option>
                    <option value={7}>7 días por semana</option>
                </select>
                <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Materias incluidas</p>
                <div className="flex flex-wrap gap-2">
                    {subjects.map(subject => {
                        const selected = studyPreferences.studySubjects.includes(subject);
                        return (
                            <button
                                key={subject}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => onUpdateStudyPreferences({
                                    ...studyPreferences,
                                    studySubjects: selected
                                        ? studyPreferences.studySubjects.filter(value => value !== subject)
                                        : [...studyPreferences.studySubjects, subject],
                                })}
                                className={`rounded-full px-3 py-1.5 text-xs font-medium ${selected ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}
                            >
                                {subject}
                            </button>
                        );
                    })}
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Si no seleccionas materias, se incluirán todas.</p>
            </div>

            {/* Installable offline app */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="mb-3 flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 dark:text-slate-100">Aplicación y acceso sin conexión</h3>
                </div>
                <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                    Instala EstudioGenius para abrirla como aplicación.                     Después de abrirla con conexión al menos una vez, el sitio y los apuntes guardados en este dispositivo pueden consultarse sin conexión. La disponibilidad depende del almacenamiento del navegador; generar preguntas y sincronizar requiere internet.
                </p>
                {isInstalled ? (
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">EstudioGenius ya está instalada en este dispositivo.</p>
                ) : installPrompt ? (
                    <Button className="w-full" onClick={() => void handleInstallApp()}>
                        <Download className="mr-2 h-4 w-4" />Instalar aplicación
                    </Button>
                ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">En iPhone, usa Compartir → Añadir a pantalla de inicio. En otros navegadores, abre el menú del sitio y elige Instalar.</p>
                )}
                {installError && <p role="alert" className="mt-2 text-xs text-rose-600 dark:text-rose-400">{installError}</p>}
            </div>

            {/* Backup */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4">Respaldo de Datos</h3>
                <div className="space-y-3">
                    <Button variant="secondary" className="w-full" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Exportar Notas
                    </Button>
                    <div>
                        <input 
                            type="file" 
                            name="notesBackup"
                            accept=".json" 
                            onChange={handleImport} 
                            className="hidden" 
                            id="import-file"
                        />
                        <label htmlFor="import-file">
                            <Button 
                                variant="secondary" 
                                className="w-full" 
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById('import-file')?.click();
                                }}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Importar Notas
                            </Button>
                        </label>
                    </div>
                </div>
            </div>

            {/* Feedback */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                    <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Tu opinión</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Tus comentarios ayudan a mejorar EstudioGenius.
                </p>
                {!feedbackOpen ? (
                    <Button variant="secondary" className="w-full" onClick={() => setFeedbackOpen(true)}>
                        Enviar opinión
                    </Button>
                ) : (
                    <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Tipo de comentario
                            <select
                                id="feedback-category"
                                name="feedbackCategory"
                                value={feedbackCategory}
                                onChange={event => setFeedbackCategory(event.target.value as UserFeedback['category'])}
                                className="mt-1 block w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                            >
                                <option value="idea">Idea</option>
                                <option value="problem">Problema</option>
                                <option value="compliment">Felicitación</option>
                            </select>
                        </label>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Calificación
                            <select
                                id="feedback-rating"
                                name="feedbackRating"
                                value={feedbackRating}
                                onChange={event => setFeedbackRating(Number(event.target.value))}
                                className="mt-1 block w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                            >
                                <option value={5}>5 - Excelente</option>
                                <option value={4}>4 - Muy buena</option>
                                <option value={3}>3 - Buena</option>
                                <option value={2}>2 - Puede mejorar</option>
                                <option value={1}>1 - Mala</option>
                            </select>
                        </label>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Comentario
                            <textarea
                                id="feedback-message"
                                name="feedbackMessage"
                                required
                                maxLength={2000}
                                rows={4}
                                value={feedbackMessage}
                                onChange={event => setFeedbackMessage(event.target.value)}
                                placeholder="Cuéntame qué te gustaría mejorar..."
                                className="mt-1 block w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                            />
                        </label>
                        {feedbackError && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{feedbackError}</p>}
                        <div className="flex gap-3">
                            <Button type="button" variant="secondary" className="flex-1" onClick={() => setFeedbackOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="flex-1" isLoading={feedbackSubmitting} disabled={!feedbackMessage.trim()}>
                                <Send className="w-4 h-4 mr-2" />
                                Enviar
                            </Button>
                        </div>
                    </form>
                )}
            </div>

            {/* Subjects Management */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4">Materias</h3>
                <div className="flex flex-wrap gap-2">
                    {subjects.map((subject) => (
                        <div key={subject} className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm">
                            <span>{subject}</span>
                            <button
                                onClick={() => onDeleteSubject(subject)}
                                className="ml-1 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title="Eliminar materia"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">Toca la X para eliminar una materia</p>
            </div>
            
            {/* App Info */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
                        <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">EstudioGenius</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Versión 1.0.0</p>
                    </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Esta aplicación usa Groq para ayudarte a estudiar. Tus notas se sincronizan con Firebase Firestore.
                </p>
            </div>

            {/* Account */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4">Cuenta</h3>
                <Button variant="secondary" className="w-full" onClick={onLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                </Button>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-5 shadow-sm border-2 border-red-200 dark:border-red-800">
                <h3 className="text-sm font-bold text-red-900 dark:text-red-100 uppercase tracking-wide mb-4 flex items-center">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Zona de Peligro
                </h3>
                
                <div className="space-y-3">
                    <div>
                        <p className="text-sm text-slate-900 dark:text-slate-100 mb-2">
                            Elimina todos tus apuntes y materias personalizadas.
                        </p>
                        <Button variant="danger" className="w-full" onClick={() => setShowClearModal(true)}>
                            Eliminar todos los datos
                        </Button>
                    </div>

                    <div className="pt-3 border-t border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-900 dark:text-red-100 mb-2 font-medium">
                            Elimina tu cuenta y todos los datos permanentemente.
                        </p>
                        <Button 
                            variant="danger" 
                            className="w-full bg-red-700 hover:bg-red-800 dark:bg-red-800 dark:hover:bg-red-900" 
                            onClick={() => setShowDeleteAccountModal(true)}
                        >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Eliminar cuenta y datos
                        </Button>
                    </div>
                </div>
            </div>

          <div className="mt-8 text-center lg:col-span-2">
            <p className="text-xs text-slate-400">Hecho con ❤️ para estudiantes</p>
            <p className="text-xs text-slate-400">© 2026 EstudioGenius. Todos los derechos reservados.</p>
            <p className="text-xs text-slate-400">Desarrollado por JuanBv.</p>
            <div className="flex justify-center gap-4 mt-3">
              <a href="/terms.html" target="_blank" className="text-xs text-indigo-500 hover:underline">Términos y Condiciones</a>
              <a href="/privacy.html" target="_blank" className="text-xs text-indigo-500 hover:underline">Política de Privacidad</a>
            </div>
          </div>
        </div>
      </div>

      <Modal
            isOpen={showClearModal}
            onClose={() => setShowClearModal(false)}
            title="¿Eliminar todos los datos?"
            footer={
                <>
                    <Button variant="secondary" onClick={() => setShowClearModal(false)}>Cancelar</Button>
                    <Button 
                        variant="danger" 
                        onClick={() => {
                            onClearAll();
                            setShowClearModal(false);
                        }}
                    >
                        Sí, eliminar datos
                    </Button>
                </>
            }
        >
            <div className="flex items-start space-x-3 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">Se eliminarán todas tus notas y materias personalizadas. Tu cuenta se mantendrá activa.</p>
            </div>
        </Modal>

        <Modal
            isOpen={showDeleteAccountModal}
            onClose={() => setShowDeleteAccountModal(false)}
            title="⚠️ ¿Eliminar cuenta permanentemente?"
            footer={
                <>
                    <Button variant="secondary" onClick={() => setShowDeleteAccountModal(false)}>Cancelar</Button>
                    <Button 
                        variant="danger"
                        className="bg-red-700 hover:bg-red-800"
                        onClick={() => {
                            onDeleteAccount();
                            setShowDeleteAccountModal(false);
                        }}
                    >
                        Sí, eliminar mi cuenta
                    </Button>
                </>
            }
        >
            <div className="space-y-3">
                <div className="flex items-start space-x-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <div className="text-sm">
                        <p className="font-bold mb-1">Esta acción es IRREVERSIBLE</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Se eliminarán todos tus datos</li>
                            <li>Se borrará tu cuenta de EstudioGenius</li>
                            <li>No podrás recuperar tu información</li>
                            <li>Deberás crear una cuenta nueva para volver</li>
                        </ul>
                    </div>
                </div>
            </div>
        </Modal>
    </>
  );
};