export interface Note {
  id: string;
  title: string;
  content: string;
  subject: string;
  createdAt: number;
  lastModified: number;
  summary?: string;
  quiz?: QuizQuestion[];
  nextReview?: number;
  reviewCount?: number;
}

export const DEFAULT_SUBJECTS = [
  'General',
  'Matemáticas',
  'Ciencias',
  'Historia',
  'Literatura',
  'Idiomas',
  'Programación'
];

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export type ViewState = 'LIST' | 'CREATE' | 'EDIT' | 'DETAIL' | 'SETTINGS';

export interface AIState {
  isLoading: boolean;
  error: string | null;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface AppSettings {
  darkMode: boolean;
}