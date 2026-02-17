import React, { useState } from 'react';
import { Note, QuizQuestion } from '../types';
import { Button } from './Button';
import { Modal } from './Modal';
import { FocusMode } from './FocusMode';
import { ChevronLeft, Edit2, Trash2, BrainCircuit, Sparkles, BookOpenCheck, HelpCircle, Trophy, RotateCcw, Search, Lightbulb, Calendar, Share2, Download, Focus } from 'lucide-react';
import { summarizeNote, generateQuiz, explainConcept } from '../services/geminiService';

interface NoteDetailProps {
  note: Note;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateNote: (updatedNote: Note) => void;
  showNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const NoteDetail: React.FC<NoteDetailProps> = ({ note, onBack, onEdit, onDelete, onUpdateNote, showNotification }) => {
  // AI States
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  
  // Quiz States
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Explanation Feature States
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [conceptToExplain, setConceptToExplain] = useState('');
  const [explanationResult, setExplanationResult] = useState<string | null>(null);

  // Delete Confirmation State
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);

  // Focus Mode State
  const [showFocusMode, setShowFocusMode] = useState(false);

  // Review Date Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDays, setReviewDays] = useState(1);
  const [customTime, setCustomTime] = useState('');

  // --- Handlers ---

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const summary = await summarizeNote(note.content);
      onUpdateNote({ ...note, summary });
      showNotification("Resumen generado con éxito", "success");
    } catch (e) {
      showNotification("Error generando resumen. Inténtalo de nuevo.", "error");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setIsGeneratingQuiz(true);
    try {
      const questions = await generateQuiz(note.content);
      if (questions.length > 0) {
        onUpdateNote({ ...note, quiz: questions });
        resetQuiz();
        setShowQuiz(true);
      } else {
        showNotification("No se pudo generar un quiz. El contenido podría ser muy corto.", "error");
      }
    } catch (e) {
      showNotification("Error generando quiz. Inténtalo de nuevo.", "error");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleExplain = async () => {
      if (!conceptToExplain.trim()) return;
      setIsExplaining(true);
      setExplanationResult(null);
      try {
          const result = await explainConcept(conceptToExplain, note.content);
          setExplanationResult(result);
      } catch (e) {
          showNotification("Error al explicar el concepto.", "error");
      } finally {
          setIsExplaining(false);
      }
  }

  const resetQuiz = () => {
      setCurrentQuizQuestion(0);
      setQuizScore(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setQuizFinished(false);
  }

  const handleAnswer = (index: number) => {
      if (selectedAnswer !== null) return;
      setSelectedAnswer(index);
      setShowExplanation(true);
      if (note.quiz && index === note.quiz[currentQuizQuestion].correctAnswerIndex) {
          setQuizScore(p => p + 1);
      }
  };

  const nextQuestion = () => {
      if (!note.quiz) return;
      if (currentQuizQuestion < note.quiz.length - 1) {
          setCurrentQuizQuestion(p => p + 1);
          setSelectedAnswer(null);
          setShowExplanation(false);
      } else {
          setQuizFinished(true);
          // Update review schedule
          const intervals = [1, 3, 7, 14, 30]; // days
          const count = (note.reviewCount || 0) + 1;
          const nextDays = intervals[Math.min(count, intervals.length - 1)];
          onUpdateNote({ 
            ...note, 
            reviewCount: count,
            nextReview: Date.now() + nextDays * 24 * 60 * 60 * 1000 
          });
      }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleExportNote = () => {
    const dataStr = JSON.stringify(note, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${note.title.replace(/[^a-z0-9]/gi, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Nota exportada', 'success');
  };

  const handleCopyText = () => {
    const text = `${note.title}\n\n${note.content}${note.summary ? '\n\nResumen:\n' + note.summary : ''}`;
    navigator.clipboard.writeText(text);
    showNotification('Texto copiado al portapapeles', 'success');
    setShowShareModal(false);
  };

  const handleSetReviewDate = () => {
    let nextReview;
    if (reviewDays === 0) {
      if (customTime) {
        const [hours, minutes] = customTime.split(':').map(Number);
        const today = new Date();
        today.setHours(hours, minutes, 0, 0);
        nextReview = today.getTime();
        if (nextReview <= Date.now()) {
          showNotification('La hora debe ser futura', 'error');
          return;
        }
      } else {
        nextReview = Date.now() + 4 * 60 * 60 * 1000;
      }
    } else {
      nextReview = Date.now() + reviewDays * 24 * 60 * 60 * 1000;
    }
    onUpdateNote({ ...note, nextReview, reviewCount: note.reviewCount || 0 });
    showNotification(reviewDays === 0 ? 'Repaso programado para hoy' : `Repaso programado para ${reviewDays} día(s)`, 'success');
    setShowReviewModal(false);
    setReviewDays(1);
    setCustomTime('');
  };

  // --- Renders ---

  if (showQuiz && note.quiz) {
      if (quizFinished) {
          const scorePercent = Math.round((quizScore / note.quiz.length) * 100);
          return (
            <div className="flex flex-col h-full bg-slate-50">
                <div className="flex items-center p-4 bg-white border-b border-slate-100 pt-safe">
                    <Button variant="ghost" size="icon" onClick={() => setShowQuiz(false)}>
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <span className="font-bold text-lg ml-2">Resultados</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                        <Trophy className="w-12 h-12 text-yellow-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">
                        {scorePercent}% Correcto
                    </h2>
                    <p className="text-slate-500 mb-8">
                        Has acertado {quizScore} de {note.quiz.length} preguntas.
                    </p>
                    <div className="w-full space-y-3">
                        <Button className="w-full" onClick={resetQuiz}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Intentar de nuevo
                        </Button>
                        <Button variant="secondary" className="w-full" onClick={() => setShowQuiz(false)}>
                            Volver al apunte
                        </Button>
                    </div>
                </div>
            </div>
          )
      }

      const q = note.quiz[currentQuizQuestion];
      return (
          <div className="flex flex-col h-full bg-slate-50">
             <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 flex items-center pt-safe">
                <Button variant="ghost" size="icon" onClick={() => setShowQuiz(false)}>
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h2 className="ml-2 font-bold text-lg">Modo Quiz</h2>
                <div className="ml-auto text-sm font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                    {currentQuizQuestion + 1} / {note.quiz.length}
                </div>
             </div>
             <div className="p-6 flex-1 overflow-y-auto pb-24">
                 <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 border border-slate-100">
                     <h3 className="text-lg font-bold text-slate-800 mb-6 leading-snug">{q.question}</h3>
                     <div className="space-y-3">
                         {q.options.map((option, idx) => (
                             <button
                                key={idx}
                                onClick={() => handleAnswer(idx)}
                                disabled={selectedAnswer !== null}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                                    selectedAnswer === null 
                                    ? 'border-slate-100 hover:border-indigo-200 bg-slate-50 hover:bg-white' 
                                    : idx === q.correctAnswerIndex
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm'
                                        : selectedAnswer === idx 
                                            ? 'border-red-500 bg-red-50 text-red-900'
                                            : 'border-slate-100 opacity-40 bg-slate-50'
                                }`}
                             >
                                 <div className="flex items-start">
                                    <span className={`inline-flex flex-shrink-0 items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-3 mt-0.5 ${
                                        selectedAnswer === null 
                                        ? 'bg-slate-200 text-slate-600'
                                        : idx === q.correctAnswerIndex
                                            ? 'bg-emerald-200 text-emerald-700'
                                            : 'bg-slate-200 text-slate-500'
                                    }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className="text-sm font-medium">{option}</span>
                                 </div>
                             </button>
                         ))}
                     </div>
                 </div>

                 {showExplanation && (
                     <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl mb-6 text-blue-900 animate-in fade-in slide-in-from-bottom-4 shadow-sm">
                         <div className="flex items-center font-bold mb-2 text-blue-700">
                             <HelpCircle className="w-5 h-5 mr-2" />
                             Explicación
                         </div>
                         <p className="text-sm leading-relaxed opacity-90">{q.explanation}</p>
                     </div>
                 )}
             </div>
             <div className="p-4 bg-white border-t border-slate-200 pb-safe">
                 <Button className="w-full shadow-lg shadow-indigo-200" onClick={nextQuestion} disabled={selectedAnswer === null}>
                     {currentQuizQuestion < note.quiz.length - 1 ? 'Siguiente Pregunta' : 'Ver Resultados'}
                 </Button>
             </div>
          </div>
      )
  }

  return (
    <>
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-10 pt-safe">
            <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2 className="w-5 h-5 text-indigo-600" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onEdit}>
                <Edit2 className="w-5 h-5 text-indigo-600" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowDeleteModal(true)}>
                <Trash2 className="w-5 h-5 text-red-500" />
            </Button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
            <div className="mb-6">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 uppercase mb-3">
                {note.subject}
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight mb-2">
                {note.title}
            </h1>
            <div className="text-xs text-slate-400 dark:text-slate-500">
                Editado el {new Date(note.lastModified).toLocaleDateString('es-ES')} a las {new Date(note.lastModified).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}
            </div>
            {note.nextReview && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="mt-3 flex items-center text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Calendar className="w-3 h-3 mr-1" />
                {note.nextReview <= Date.now() 
                  ? '¡Listo para repasar! (cambiar)' 
                  : (() => {
                      const diff = note.nextReview - Date.now();
                      const hours = Math.floor(diff / (1000 * 60 * 60));
                      if (hours < 24) {
                        return `Repasar hoy a las ${new Date(note.nextReview).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})} (cambiar)`;
                      }
                      return `Repasar el ${new Date(note.nextReview).toLocaleDateString('es-ES')} (cambiar)`;
                    })()}
              </button>
            )}
            {!note.nextReview && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="mt-3 flex items-center text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              >
                <Calendar className="w-3 h-3 mr-1" />
                Programar repaso
              </button>
            )}
            </div>

            {/* AI Actions Area */}
            <div className="grid grid-cols-4 gap-2 mb-8">
                <button 
                    onClick={handleSummarize}
                    disabled={isSummarizing}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 active:scale-95 transition-all"
                >
                    <Sparkles className={`w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-1 ${isSummarizing ? 'animate-pulse' : ''}`} />
                    <span className="text-[10px] font-bold text-indigo-900 dark:text-indigo-300 text-center leading-tight">
                        {isSummarizing ? '...' : 'Resumir'}
                    </span>
                </button>
                
                <button 
                    onClick={handleGenerateQuiz}
                    disabled={isGeneratingQuiz}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 active:scale-95 transition-all"
                >
                    <BookOpenCheck className={`w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-1 ${isGeneratingQuiz ? 'animate-pulse' : ''}`} />
                    <span className="text-[10px] font-bold text-emerald-900 dark:text-emerald-300 text-center leading-tight">
                        {isGeneratingQuiz ? '...' : 'Quiz'}
                    </span>
                </button>

                <button 
                    onClick={() => {
                        setConceptToExplain('');
                        setExplanationResult(null);
                        setShowExplainModal(true);
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 active:scale-95 transition-all"
                >
                    <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 mb-1" />
                    <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 text-center leading-tight">
                        Explicar
                    </span>
                </button>

                <button 
                    onClick={() => setShowFocusMode(true)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800 active:scale-95 transition-all"
                >
                    <Focus className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-1" />
                    <span className="text-[10px] font-bold text-purple-900 dark:text-purple-300 text-center leading-tight">
                        Enfocar
                    </span>
                </button>
            </div>

            {note.summary && (
                <div className="mb-8 p-5 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/50">
                    <h3 className="flex items-center text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-3">
                        <BrainCircuit className="w-4 h-4 mr-2" />
                        Resumen Inteligente
                    </h3>
                    <div className="prose prose-sm prose-indigo dark:prose-invert text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {note.summary}
                    </div>
                </div>
            )}

            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-7 whitespace-pre-wrap pb-10">
            {note.content}
            </div>
        </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="¿Eliminar apunte?"
            footer={
                <>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
                    <Button variant="danger" onClick={onDelete}>Eliminar</Button>
                </>
            }
        >
            <p className="text-slate-600 dark:text-slate-300">Estás a punto de eliminar <strong>{note.title}</strong>. Esta acción no se puede deshacer.</p>
        </Modal>

        {/* Explain Concept Modal */}
        <Modal
            isOpen={showExplainModal}
            onClose={() => setShowExplainModal(false)}
            title="Explicar Concepto"
            footer={
                <Button variant="secondary" onClick={() => setShowExplainModal(false)} className="w-full">
                    Cerrar
                </Button>
            }
        >
            <div className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Escribe un término o frase de tu apunte que no entiendas, y la IA te lo explicará en contexto.</p>
                <div className="relative">
                    <input 
                        type="text" 
                        value={conceptToExplain}
                        onChange={(e) => setConceptToExplain(e.target.value)}
                        placeholder="Ej: Mitocondria, Derivada, etc."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleExplain()}
                    />
                    <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                </div>
                
                <Button 
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white" 
                    onClick={handleExplain}
                    disabled={!conceptToExplain.trim() || isExplaining}
                    isLoading={isExplaining}
                >
                    {isExplaining ? 'Analizando...' : 'Explicar'}
                </Button>

                {explanationResult && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800 text-slate-800 dark:text-slate-200 text-sm leading-relaxed animate-in fade-in">
                        <h4 className="font-bold text-amber-800 dark:text-amber-400 mb-1 flex items-center">
                            <Lightbulb className="w-4 h-4 mr-2" /> Explicación:
                        </h4>
                        {explanationResult}
                    </div>
                )}
            </div>
        </Modal>

        {/* Share Modal */}
        <Modal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            title="Compartir Nota"
            footer={
                <Button variant="secondary" onClick={() => setShowShareModal(false)} className="w-full">
                    Cerrar
                </Button>
            }
        >
            <div className="space-y-3">
                <Button variant="secondary" className="w-full" onClick={handleCopyText}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Copiar texto
                </Button>
                <Button variant="secondary" className="w-full" onClick={handleExportNote}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar como JSON
                </Button>
            </div>
        </Modal>

        {/* Focus Mode */}
        {showFocusMode && (
            <FocusMode 
                note={note} 
                onClose={() => setShowFocusMode(false)} 
            />
        )}

        {/* Review Date Modal */}
        <Modal
            isOpen={showReviewModal}
            onClose={() => setShowReviewModal(false)}
            title="Programar Repaso"
            footer={
                <>
                    <Button variant="secondary" onClick={() => setShowReviewModal(false)}>Cancelar</Button>
                    <Button onClick={handleSetReviewDate}>Guardar</Button>
                </>
            }
        >
            <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-300">¿Cuándo quieres repasar esta nota?</p>
                <div className="space-y-2">
                    <button
                        onClick={() => setReviewDays(0)}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                            reviewDays === 0
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800'
                        }`}
                    >
                        <div className="font-medium">Hoy</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Selecciona la hora</div>
                    </button>
                    {reviewDays === 0 && (
                        <input
                            type="time"
                            value={customTime}
                            onChange={(e) => setCustomTime(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    )}
                    {[1, 3, 7, 14, 30].map(days => (
                        <button
                            key={days}
                            onClick={() => setReviewDays(days)}
                            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                                reviewDays === days
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800'
                            }`}
                        >
                            <div className="font-medium">En {days} día{days > 1 ? 's' : ''}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                {new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </Modal>
    </>
  );
};