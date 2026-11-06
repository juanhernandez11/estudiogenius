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
  quizAttempts?: number;
  quizCorrect?: number;
  lastStudiedAt?: number;
  failedQuestions?: FailedStudyQuestion[];
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

export type ViewState = 'LIST' | 'STUDY' | 'CREATE' | 'EDIT' | 'DETAIL' | 'SETTINGS';

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
  notificationsEnabled: boolean;
  studyDuration: 5 | 10 | 15;
  studyPriority: 'balanced' | 'due' | 'weak' | 'new';
  studySubjects: string[];
  weeklyStudyGoal: 3 | 5 | 7;
}

export interface UserFeedback {
  category: 'idea' | 'problem' | 'compliment';
  rating: number;
  message: string;
}

export interface StudyProgress {
  currentStreak: number;
  lastStudyDate: string | null;
  studyDates?: string[];
}

export type ExplanationStyle = 'simple' | 'analogy' | 'example' | 'steps' | 'socratic';

export interface StudyPlanNote {
  id: string;
  title: string;
  subject: string;
  content: string;
}

export interface StudyQuestion extends QuizQuestion {
  sourceNoteId: string;
  reviewId?: string;
}

export interface FailedStudyQuestion extends QuizQuestion {
  id: string;
}

export interface StudyResult {
  noteId: string;
  correct: number;
  total: number;
  failedQuestions: FailedStudyQuestion[];
  resolvedQuestionIds: string[];
}