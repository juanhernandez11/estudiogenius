import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { X, Play, Pause, RotateCcw, Coffee } from 'lucide-react';

interface FocusModeProps {
  note: { title: string; content: string; summary?: string };
  onClose: () => void;
}

export const FocusMode: React.FC<FocusModeProps> = ({ note, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('EstudioGenius', {
          body: isBreak ? '¡Descanso terminado! Vuelve a estudiar' : '¡Tiempo de descanso!',
          icon: '/img/Gemini_Generated_Image_s5ygros5ygros5yg.png'
        });
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isBreak]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
  };

  const handleBreak = () => {
    setIsBreak(!isBreak);
    setTimeLeft(isBreak ? 25 * 60 : 5 * 60);
    setIsRunning(false);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900 dark:bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h2 className="text-lg font-bold">Modo Enfocado</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Timer */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center mb-8">
          <div className="text-8xl font-bold mb-4 font-mono">{formatTime(timeLeft)}</div>
          <p className="text-slate-400 text-lg">
            {isBreak ? '☕ Tiempo de descanso' : '📚 Tiempo de estudio'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-8">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsRunning(!isRunning)}
            className="w-24"
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </Button>
          <Button variant="secondary" size="lg" onClick={handleReset}>
            <RotateCcw className="w-6 h-6" />
          </Button>
          <Button variant="secondary" size="lg" onClick={handleBreak}>
            <Coffee className="w-6 h-6" />
          </Button>
        </div>

        {/* Note Preview */}
        <div className="w-full max-w-2xl bg-slate-800 dark:bg-slate-900 rounded-2xl p-6 max-h-64 overflow-y-auto">
          <h3 className="text-xl font-bold mb-3">{note.title}</h3>
          {note.summary ? (
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {note.summary}
            </div>
          ) : (
            <div className="text-slate-400 text-sm leading-relaxed line-clamp-6">
              {note.content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
