import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, CalendarDays, Clock3, Flag, Flame, GraduationCap, Lightbulb, Play, RotateCcw, Settings2, Sparkles, Target, Zap } from 'lucide-react';
import { AppSettings, FailedStudyQuestion, Note, StudyQuestion, StudyProgress, StudyResult } from '../types';
import { generateStudyQuestions } from '../services/groqService';
import { getMastery, getMasteryLabel } from '../utils/study';
import { Button } from './Button';
import { v4 as uuidv4 } from 'uuid';

interface StudyHubProps {
  notes: Note[];
  streakDays: number;
  studyProgress: StudyProgress;
  studyPreferences: Pick<AppSettings, 'studyDuration' | 'studyPriority' | 'studySubjects' | 'weeklyStudyGoal'>;
  profileName: string;
  profilePhoto: string | null;
  onOpenSettings: () => void;
  onCreateNote: () => void;
  onStudyComplete: (results: StudyResult[]) => void;
  onReportQuestion: (question: string, sourceTitle: string) => void;
}

type SessionMode = 'route' | 'exam' | 'express' | 'review';
type Screen = 'home' | 'session' | 'results';

const localDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const StudyHub: React.FC<StudyHubProps> = ({ notes, streakDays, studyProgress, studyPreferences, profileName, profilePhoto, onOpenSettings, onCreateNote, onStudyComplete, onReportQuestion }) => {
  const [screen, setScreen] = useState<Screen>('home');
  const [sessionMode, setSessionMode] = useState<SessionMode>('route');
  const [questions, setQuestions] = useState<StudyQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultPercent, setResultPercent] = useState(0);
  const [resultCorrect, setResultCorrect] = useState(0);
  const [resultTotal, setResultTotal] = useState(0);
  const [resultByNote, setResultByNote] = useState<StudyResult[]>([]);
  const finished = useRef(false);

  const todayKey = localDateKey(new Date());
  const studiedToday = notes.some(note => note.lastStudiedAt && localDateKey(new Date(note.lastStudiedAt)) === todayKey);
  const filteredNotes = useMemo(
    () => studyPreferences.studySubjects.length
      ? notes.filter(note => studyPreferences.studySubjects.includes(note.subject))
      : notes,
    [notes, studyPreferences.studySubjects]
  );
  const dueNotes = useMemo(
    () => filteredNotes.filter(note => note.nextReview && note.nextReview <= Date.now()),
    [filteredNotes]
  );
  const prioritizedNotes = useMemo(() => [...filteredNotes].sort((a, b) => {
      const aDue = a.nextReview && a.nextReview <= Date.now() ? 1 : 0;
      const bDue = b.nextReview && b.nextReview <= Date.now() ? 1 : 0;
      const aMastery = getMastery(a);
      const bMastery = getMastery(b);
      if (studyPreferences.studyPriority === 'due' && aDue !== bDue) return bDue - aDue;
      if (studyPreferences.studyPriority === 'weak' && aMastery !== bMastery) {
        if (aMastery === null) return 1;
        if (bMastery === null) return -1;
        return aMastery - bMastery;
      }
      if (studyPreferences.studyPriority === 'new') {
        const aNew = aMastery === null ? 1 : 0;
        const bNew = bMastery === null ? 1 : 0;
        if (aNew !== bNew) return bNew - aNew;
      }
      if (studyPreferences.studyPriority === 'balanced' && aDue !== bDue) return bDue - aDue;
      if (aMastery === null && bMastery !== null) return 1;
      if (bMastery === null && aMastery !== null) return -1;
      if (aMastery !== bMastery && aMastery !== null && bMastery !== null) return aMastery - bMastery;
      return (a.lastStudiedAt || a.lastModified) - (b.lastStudiedAt || b.lastModified);
    }), [filteredNotes, studyPreferences.studyPriority]);
  const routeNotes = prioritizedNotes.slice(0, studyPreferences.studyDuration === 5 ? 2 : studyPreferences.studyDuration === 10 ? 3 : 4);
  const failedQuestionCount = notes.reduce((count, note) => count + (note.failedQuestions?.length || 0), 0);
  const weekDays = useMemo(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const activityDates = new Set(studyProgress.studyDates || (studyProgress.lastStudyDate ? [studyProgress.lastStudyDate] : []));
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const key = localDateKey(date);
      return { key, label: date.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', ''), day: date.getDate(), active: activityDates.has(key), today: key === todayKey };
    });
  }, [studyProgress.lastStudyDate, studyProgress.studyDates, todayKey]);
  const weeklyActivityCount = weekDays.filter(day => day.active).length;
  const totalAnswers = notes.reduce((total, note) => total + (note.quizAttempts || 0), 0);
  const totalCorrect = notes.reduce((total, note) => total + (note.quizCorrect || 0), 0);
  const accuracy = totalAnswers ? Math.round((totalCorrect / totalAnswers) * 100) : null;
  const masteredTopics = notes.filter(note => (getMastery(note) ?? 0) >= 85).length;

  const finishSession = () => {
    if (finished.current || questions.length === 0) return;
    finished.current = true;
    const scoreByNote = new Map<string, StudyResult>();
    let correct = 0;
    questions.forEach((question, index) => {
      const result = scoreByNote.get(question.sourceNoteId) || {
        noteId: question.sourceNoteId,
        correct: 0,
        total: 0,
        failedQuestions: [],
        resolvedQuestionIds: [],
      };
      result.total += 1;
      if (answers[index] === question.correctAnswerIndex) {
        result.correct += 1;
        correct += 1;
        if (question.reviewId) result.resolvedQuestionIds.push(question.reviewId);
      } else {
        const failedQuestion: FailedStudyQuestion = {
          id: question.reviewId || uuidv4(),
          question: question.question,
          options: question.options,
          correctAnswerIndex: question.correctAnswerIndex,
          explanation: question.explanation,
        };
        result.failedQuestions.push(failedQuestion);
      }
      scoreByNote.set(question.sourceNoteId, result);
    });
    setResultCorrect(correct);
    setResultTotal(questions.length);
    setResultPercent(Math.round((correct / questions.length) * 100));
    const results = [...scoreByNote.values()];
    setResultByNote(results);
    if (Object.keys(answers).length > 0) onStudyComplete(results);
    setScreen('results');
  };

  useEffect(() => {
    if (screen !== 'session' || (sessionMode !== 'exam' && sessionMode !== 'express') || finished.current) return;
    if (secondsLeft <= 0) {
      finishSession();
      return;
    }
    const timer = window.setTimeout(() => setSecondsLeft(seconds => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [screen, sessionMode, secondsLeft]);

  const startSession = async (mode: SessionMode) => {
    const selectedNotes = mode === 'route' ? routeNotes : mode === 'exam' ? prioritizedNotes.slice(0, 6) : mode === 'express' ? prioritizedNotes.slice(0, 2) : [];
    if (mode === 'review') {
      const reviewQuestions = notes.flatMap(note => (note.failedQuestions || []).map(question => ({
        ...question,
        sourceNoteId: note.id,
        reviewId: question.id,
      }))).slice(0, 10);
      if (!reviewQuestions.length) return;
      setQuestions(reviewQuestions);
      setAnswers({});
      setQuestionIndex(0);
      setSessionMode('review');
      setSecondsLeft(0);
      finished.current = false;
      setScreen('session');
      return;
    }
    if (!selectedNotes.length) return;

    setIsLoading(true);
    setError('');
    setSessionMode(mode);
    try {
      const questionsPerNote = mode === 'express' ? 1 : mode === 'route' ? studyPreferences.studyDuration === 5 ? 1 : studyPreferences.studyDuration === 10 ? 2 : 3 : 2;
      const generated = await generateStudyQuestions(selectedNotes, questionsPerNote);
      setQuestions(generated);
      setAnswers({});
      setQuestionIndex(0);
      setSecondsLeft(mode === 'express' ? 5 * 60 : 15 * 60);
      finished.current = false;
      setScreen('session');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo preparar la sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  const restart = () => {
    setScreen('home');
    setQuestions([]);
    setAnswers({});
    setError('');
    finished.current = false;
  };

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  if (screen === 'session') {
    const question = questions[questionIndex];
    const note = notes.find(candidate => candidate.id === question.sourceNoteId);
    const selectedAnswer = answers[questionIndex];
    return (
      <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-900">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-800 lg:px-8">
          <button onClick={restart} aria-label="Salir de la sesión" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100">{sessionMode === 'exam' ? 'Modo examen' : sessionMode === 'express' ? 'Sesión exprés' : sessionMode === 'review' ? 'Repaso de errores' : 'Ruta de hoy'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{note?.subject} · {note?.title}</p>
          </div>
          {(sessionMode === 'exam' || sessionMode === 'express') && <div className="ml-auto flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 font-mono font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"><Clock3 className="h-4 w-4" />{formatTime(secondsLeft)}</div>}
          <span className="ml-auto text-sm font-semibold text-slate-500 dark:text-slate-400">{questionIndex + 1}/{questions.length}</span>
        </header>
        <main className="flex-1 overflow-y-auto p-5 lg:mx-auto lg:w-full lg:max-w-3xl lg:p-8">
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} />
          </div>
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:p-8">
            <h1 className="mb-6 text-xl font-bold leading-relaxed text-slate-900 dark:text-slate-100">{question.question}</h1>
            <div className="space-y-3">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = selectedAnswer !== undefined && index === question.correctAnswerIndex;
                const isWrong = isSelected && index !== question.correctAnswerIndex;
                return (
                  <button
                    key={`${question.sourceNoteId}-${index}`}
                    disabled={selectedAnswer !== undefined}
                    onClick={() => setAnswers(current => ({ ...current, [questionIndex]: index }))}
                    className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                      isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-100'
                        : isWrong ? 'border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-900/20 dark:text-rose-100'
                          : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
                    }`}
                  >
                    <span className="font-bold">{String.fromCharCode(65 + index)}.</span>{option}
                  </button>
                );
              })}
            </div>
            {selectedAnswer !== undefined && (
              <div className="mt-5 flex gap-3 rounded-xl bg-indigo-50 p-4 text-sm leading-relaxed text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-100">
                <Lightbulb className="h-5 w-5 shrink-0" />
                <p>{question.explanation}</p>
              </div>
            )}
            <button type="button" onClick={() => onReportQuestion(question.question, note?.title || 'Apunte')} className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400">
              <Flag className="h-4 w-4" />Reportar pregunta dudosa
            </button>
          </section>
          <div className="mt-5 flex justify-between gap-3">
            <Button variant="secondary" disabled={questionIndex === 0} onClick={() => setQuestionIndex(index => index - 1)}>Anterior</Button>
            {questionIndex === questions.length - 1
              ? <Button onClick={finishSession} disabled={selectedAnswer === undefined}>Terminar sesión</Button>
              : <Button onClick={() => setQuestionIndex(index => index + 1)} disabled={selectedAnswer === undefined}>Siguiente</Button>}
          </div>
        </main>
      </div>
    );
  }

  if (screen === 'results') {
    return (
      <div className="flex h-full flex-col items-center justify-center overflow-y-auto bg-slate-50 p-6 text-center dark:bg-slate-900">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
          <GraduationCap className="h-10 w-10" />
        </div>
        <p className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">Sesión completada</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900 dark:text-slate-100">{resultPercent}%</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">{resultCorrect} de {resultTotal} respuestas correctas. Cada repaso cuenta; usa los errores como guía para tu siguiente sesión.</p>
        <div className="mt-5 w-full max-w-sm space-y-2 text-left">
          {resultByNote.map(result => {
            const note = notes.find(candidate => candidate.id === result.noteId);
            const percent = Math.round((result.correct / result.total) * 100);
            return (
              <div key={result.noteId} className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm dark:bg-slate-800">
                <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{note?.title || 'Apunte'}</span>
                <span className={`shrink-0 text-xs font-bold ${percent < 60 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {percent < 60 ? 'Para reforzar' : 'Buen avance'} · {percent}%
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-6 w-full max-w-sm space-y-3">
          <Button className="w-full" onClick={restart}><RotateCcw className="mr-2 h-4 w-4" />Volver a mi ruta</Button>
        </div>
      </div>
    );
  }

  const masteryNotes = [...notes].sort((a, b) => (getMastery(a) ?? -1) - (getMastery(b) ?? -1));
  const getReason = (note: Note) => {
    if (note.nextReview && note.nextReview <= Date.now()) return 'Repaso pendiente';
    const mastery = getMastery(note);
    if (mastery !== null && mastery < 60) return 'Tema para reforzar';
    if (mastery === null) return 'Primer diagnóstico';
    return 'Mantener lo aprendido';
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 pb-24 dark:bg-slate-900 lg:pb-8">
      <header className="border-b border-slate-100 bg-white px-5 py-7 dark:border-slate-700 dark:bg-slate-800 lg:px-10 lg:py-9">
        <p className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">Tu entrenador de estudio</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100 lg:text-4xl">¿Qué estudiamos hoy?</h1>
        <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">Una ruta corta, hecha con tus propios apuntes. Practica, descubre qué reforzar y avanza a tu ritmo.</p>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-5 lg:p-10">
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              {profilePhoto
                ? <img src={profilePhoto} alt="" referrerPolicy="no-referrer" className="h-14 w-14 rounded-full object-cover ring-2 ring-indigo-100 dark:ring-indigo-900" />
                : <div aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xl font-black text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">{profileName.charAt(0).toUpperCase()}</div>}
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">Mi perfil de estudio</p>
                <h2 className="truncate text-xl font-extrabold text-slate-900 dark:text-slate-100">¡Hola, {profileName.split(' ')[0]}!</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{streakDays ? `${streakDays} días de racha` : 'Cada sesión cuenta para tu progreso'}</p>
              </div>
            </div>
            <Button variant="secondary" onClick={onOpenSettings} className="shrink-0">
              <Settings2 className="mr-2 h-4 w-4" />Ajustar mi plan
            </Button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl bg-indigo-50 p-4 dark:bg-indigo-900/20">
              <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Meta semanal</p>
              <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">{Math.min(weeklyActivityCount, studyPreferences.weeklyStudyGoal)}<span className="text-sm font-semibold text-slate-500 dark:text-slate-400">/{studyPreferences.weeklyStudyGoal} días</span></p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-950">
                <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${Math.min(100, (weeklyActivityCount / studyPreferences.weeklyStudyGoal) * 100)}%` }} />
              </div>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Aciertos</p>
              <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">{accuracy === null ? '—' : `${accuracy}%`}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{totalAnswers} respuestas</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Temas dominados</p>
              <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">{masteredTopics}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">de {notes.length} apuntes</p>
            </div>
            <div className="rounded-xl bg-rose-50 p-4 dark:bg-rose-900/20">
              <p className="text-xs font-medium text-rose-700 dark:text-rose-300">Por reforzar</p>
              <p className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100">{failedQuestionCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">preguntas pendientes</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white md:col-span-2 lg:p-7">
            <div className="flex items-center gap-2 text-indigo-100"><Sparkles className="h-5 w-5" /><span className="text-sm font-bold uppercase tracking-wider">Tu ruta personalizada</span></div>
            <h2 className="mt-3 text-2xl font-extrabold">{studyPreferences.studyDuration} minutos para avanzar</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-indigo-100">Elegimos hasta {routeNotes.length} temas según tus preferencias. Las preguntas se crean usando tus apuntes y la ruta dura aproximadamente {studyPreferences.studyDuration} minutos.</p>
            <Button onClick={() => void startSession('route')} disabled={isLoading || !routeNotes.length} isLoading={isLoading} className="mt-5 bg-white text-indigo-700 hover:bg-indigo-50 focus:ring-white">
              <Play className="mr-2 h-4 w-4" />Empezar ruta de {studyPreferences.studyDuration} min
            </Button>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:p-7">
            <div className="flex items-center gap-2 text-orange-500"><Flame className="h-5 w-5" /><span className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Racha flexible</span></div>
            <p className="mt-4 text-4xl font-black text-slate-900 dark:text-slate-100">{streakDays} <span className="text-base font-semibold">días</span></p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{studiedToday ? 'Ya estudiaste hoy. ¡Buen trabajo!' : 'Un día ocupado no borra lo aprendido. Puedes retomar cuando quieras.'}</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:p-7">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Tu plan de hoy</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{dueNotes.length} repasos pendientes · hasta {routeNotes.length} temas</p>
              </div>
              <Target className="h-6 w-6 text-indigo-500" />
            </div>
            {routeNotes.length ? (
              <div className="space-y-3">
                {routeNotes.map((note, index) => {
                  const mastery = getMastery(note);
                  return (
                    <div key={note.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-700/50">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{note.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{note.subject} · {getReason(note)}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                        mastery === null ? 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200'
                          : mastery < 60 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                            : mastery < 85 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      }`}>{getMasteryLabel(mastery)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-5 text-center dark:bg-slate-700/50">
                <BookOpen className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 font-semibold text-slate-800 dark:text-slate-100">
                  {notes.length ? 'No hay apuntes en las materias seleccionadas.' : 'Primero crea tu material de estudio'}
                </p>
                {notes.length
                  ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Cambia las materias incluidas en Ajustes → Preferencias de estudio.</p>
                  : <Button className="mt-3" onClick={onCreateNote}>Crear mi primer apunte</Button>}
              </div>
            )}
            {error && <p role="alert" className="mt-4 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:p-7">
            <div className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-violet-500" /><h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Modo examen</h2></div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">Simulacro cronometrado de 15 minutos con preguntas mezcladas de hasta seis apuntes. Al final verás tu resultado y qué temas conviene reforzar.</p>
            <Button variant="secondary" className="mt-5 w-full" disabled={isLoading || !prioritizedNotes.length} isLoading={isLoading} onClick={() => void startSession('exam')}>
              <Clock3 className="mr-2 h-4 w-4" />Empezar simulacro
            </Button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:p-7">
            <div className="flex items-center gap-2"><Zap className="h-5 w-5 text-amber-500" /><h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Sesión exprés</h2></div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">Repasa hasta dos apuntes con preguntas rápidas y un temporizador de cinco minutos.</p>
            <Button variant="secondary" className="mt-5 w-full" disabled={isLoading || !routeNotes.length} isLoading={isLoading} onClick={() => void startSession('express')}>
              <Zap className="mr-2 h-4 w-4" />Empezar 5 minutos
            </Button>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:p-7">
            <div className="flex items-center gap-2"><RotateCcw className="h-5 w-5 text-rose-500" /><h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Repasar errores</h2></div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{failedQuestionCount ? `${failedQuestionCount} pregunta(s) incorrecta(s) esperan otro intento.` : 'Las preguntas que falles en tus sesiones aparecerán aquí para reforzarlas.'}</p>
            <Button variant="secondary" className="mt-5 w-full" disabled={!failedQuestionCount} onClick={() => void startSession('review')}>
              <RotateCcw className="mr-2 h-4 w-4" />Repasar ahora
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:p-7">
          <div className="mb-4 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-indigo-500" /><h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Esta semana</h2></div>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => (
              <div key={day.key} className={`flex flex-col items-center rounded-xl p-3 ${day.today ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
                <span className="text-xs capitalize text-slate-500 dark:text-slate-400">{day.label}</span>
                <span className={`mt-1 text-sm font-bold ${day.today ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-100'}`}>{day.day}</span>
                <span aria-label={day.active ? 'Día estudiado' : 'Sin actividad registrada'} className={`mt-2 h-2 w-2 rounded-full ${day.active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:p-7">
          <div className="mb-4">
            <div className="flex items-center gap-2"><Target className="h-5 w-5 text-indigo-500" /><h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Semáforo de dominio</h2></div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Se calcula con tus respuestas: en práctica (&lt;60%), casi dominado (60–84%) y lo dominas (85% o más).</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {masteryNotes.slice(0, 6).map(note => {
              const mastery = getMastery(note);
              return (
                <div key={note.id} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-700/50">
                  <div className="flex justify-between gap-2">
                    <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{note.title}</p>
                    <span className="shrink-0 text-sm font-bold text-slate-700 dark:text-slate-200">{mastery === null ? '—' : `${mastery}%`}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600">
                    <div className={`h-full rounded-full ${mastery === null ? 'bg-slate-400' : mastery < 60 ? 'bg-rose-500' : mastery < 85 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${mastery ?? 0}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{mastery === null ? 'Aún sin diagnóstico' : `${getMasteryLabel(mastery)} · basado en ${note.quizAttempts} ${note.quizAttempts === 1 ? 'respuesta' : 'respuestas'}`}</p>
                </div>
              );
            })}
            {!notes.length && <p className="text-sm text-slate-500 dark:text-slate-400">Tus temas aparecerán aquí después de crear apuntes.</p>}
          </div>
        </section>
      </main>
    </div>
  );
};
