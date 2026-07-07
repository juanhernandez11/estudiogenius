import React from 'react';
import { Note } from '../types';
import { BookOpen, BrainCircuit, Trophy, Clock, TrendingUp } from 'lucide-react';

interface StatsProps {
  notes: Note[];
}

export const Stats: React.FC<StatsProps> = ({ notes }) => {
  const totalNotes = notes.length;
  const notesWithSummary = notes.filter(n => n.summary).length;
  const notesWithQuiz = notes.filter(n => n.quiz && n.quiz.length > 0).length;
  const totalReviews = notes.reduce((acc, n) => acc + (n.reviewCount || 0), 0);
  const notesToReview = notes.filter(n => n.nextReview && n.nextReview <= Date.now()).length;
  const subjectsUsed = new Set(notes.map(n => n.subject)).size;

  const stats = [
    { icon: <BookOpen className="w-5 h-5" />, label: 'Apuntes creados', value: totalNotes, color: 'indigo' },
    { icon: <BrainCircuit className="w-5 h-5" />, label: 'Resúmenes IA', value: notesWithSummary, color: 'purple' },
    { icon: <Trophy className="w-5 h-5" />, label: 'Quizzes generados', value: notesWithQuiz, color: 'emerald' },
    { icon: <Clock className="w-5 h-5" />, label: 'Repasos completados', value: totalReviews, color: 'amber' },
    { icon: <TrendingUp className="w-5 h-5" />, label: 'Materias activas', value: subjectsUsed, color: 'pink' },
  ];

  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    pink: 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide mb-4">
        📊 Mis Estadísticas
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
            <div className={`p-2 rounded-lg ${colorMap[stat.color]}`}>
              {stat.icon}
            </div>
            <div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100">{stat.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{stat.label}</div>
            </div>
          </div>
        ))}
        {notesToReview > 0 && (
          <div className="col-span-2 flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <span className="text-amber-600 font-bold text-sm">🔔 {notesToReview} nota{notesToReview > 1 ? 's' : ''} lista{notesToReview > 1 ? 's' : ''} para repasar</span>
          </div>
        )}
      </div>
    </div>
  );
};
