import { Note } from '../types';

export const getMastery = (note: Note): number | null => {
  if (!note.quizAttempts) return null;
  return Math.round(((note.quizCorrect || 0) / note.quizAttempts) * 100);
};

export const getMasteryLabel = (mastery: number | null): string => {
  if (mastery === null) return 'Por aprender';
  if (mastery < 60) return 'En práctica';
  if (mastery < 85) return 'Casi dominado';
  return 'Lo dominas';
};
