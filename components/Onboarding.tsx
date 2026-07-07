import React, { useState } from 'react';
import { BrainCircuit, Sparkles, BookOpenCheck, Bell, ChevronRight, Lightbulb } from 'lucide-react';

interface OnboardingProps {
  onFinish: () => void;
}

const slides = [
  {
    icon: <BrainCircuit className="w-16 h-16 text-indigo-500" />,
    bg: 'from-indigo-50 to-purple-50',
    accent: 'text-indigo-600',
    title: '¡Bienvenido a EstudioGenius!',
    subtitle: 'Tu asistente de estudio con Inteligencia Artificial',
    body: 'Diseñado para estudiantes mexicanos que quieren aprender más en menos tiempo, de forma gratuita y en español.',
  },
  {
    icon: <span className="text-7xl">🧠</span>,
    bg: 'from-amber-50 to-orange-50',
    accent: 'text-amber-600',
    title: 'La Curva del Olvido',
    subtitle: 'Ciencia detrás de EstudioGenius',
    body: 'El psicólogo Hermann Ebbinghaus demostró que olvidamos el 70% de lo aprendido en 24 horas sin repaso. EstudioGenius programa recordatorios en el momento exacto para que no olvides nada.',
    highlight: '70% olvidado en 24h → 0% con repaso espaciado',
  },
  {
    icon: <Sparkles className="w-16 h-16 text-purple-500" />,
    bg: 'from-purple-50 to-pink-50',
    accent: 'text-purple-600',
    title: 'IA que entiende tus apuntes',
    subtitle: 'Resúmenes en segundos',
    body: 'Escribe tus notas y con un toque genera un resumen inteligente con viñetas, perfecto para repasar antes de un examen.',
  },
  {
    icon: <BookOpenCheck className="w-16 h-16 text-emerald-500" />,
    bg: 'from-emerald-50 to-teal-50',
    accent: 'text-emerald-600',
    title: 'Quizzes automáticos',
    subtitle: 'Ponte a prueba con tus propias notas',
    body: 'La IA genera preguntas de opción múltiple basadas en tu contenido. Cada respuesta incluye una explicación para que aprendas de tus errores.',
  },
  {
    icon: <Bell className="w-16 h-16 text-rose-500" />,
    bg: 'from-rose-50 to-red-50',
    accent: 'text-rose-600',
    title: 'Recordatorios inteligentes',
    subtitle: 'Repasa en el momento exacto',
    body: 'El sistema programa automáticamente tus repasos a 1, 3, 7, 14 y 30 días. Recibirás una notificación justo antes de que olvides el contenido.',
  },
  {
    icon: <Lightbulb className="w-16 h-16 text-indigo-500" />,
    bg: 'from-indigo-50 to-blue-50',
    accent: 'text-indigo-600',
    title: '¡Todo listo!',
    subtitle: 'Empieza a estudiar de forma inteligente',
    body: 'Crea tu primer apunte, genera un resumen con IA y programa tu primer repaso. Tu futuro yo te lo agradecerá.',
  },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onFinish }) => {
  const [current, setCurrent] = useState(0);
  const slide = slides[current];
  const isLast = current === slides.length - 1;

  return (
    <div className={`h-screen w-full bg-gradient-to-br ${slide.bg} flex flex-col transition-all duration-500`}>
      {/* Skip */}
      <div className="flex justify-end p-4">
        <button onClick={onFinish} className="text-sm text-slate-400 hover:text-slate-600 transition-colors px-3 py-1">
          Saltar
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="mb-8 animate-in zoom-in duration-300">
          {slide.icon}
        </div>

        <h1 className="text-3xl font-black text-slate-900 mb-2 leading-tight">
          {slide.title}
        </h1>
        <p className={`text-sm font-bold uppercase tracking-widest mb-4 ${slide.accent}`}>
          {slide.subtitle}
        </p>
        <p className="text-slate-600 text-base leading-relaxed max-w-xs">
          {slide.body}
        </p>

        {slide.highlight && (
          <div className="mt-6 bg-white/80 backdrop-blur-sm border border-amber-200 rounded-2xl px-5 py-3">
            <p className="text-amber-700 font-bold text-sm">{slide.highlight}</p>
          </div>
        )}
      </div>

      {/* Dots + Button */}
      <div className="p-8 flex flex-col items-center gap-6">
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'w-6 h-2 bg-indigo-600' : 'w-2 h-2 bg-slate-300'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => isLast ? onFinish() : setCurrent(c => c + 1)}
          className="w-full max-w-xs h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 active:scale-95 transition-all text-lg"
        >
          {isLast ? '🚀 Comenzar' : 'Siguiente'}
          {!isLast && <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};
