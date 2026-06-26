export interface AuraDocument {
  id: string;
  name: string;
  size: number;
  type: 'pdf' | 'docx' | 'txt' | 'pptx';
  content: string;
  pages: string[];
  topicContext: string;
  sections: AuraSection[];
  highlights: AuraHighlight[];
  summary: string;
  uploadedAt: string;
}

export interface AuraSection {
  id: string;
  title: string;
  content: string;
  summary: string;
}

export interface AuraHighlight {
  id: string;
  text: string;
  color: 'yellow' | 'blue' | 'green' | 'purple';
  type: 'fact' | 'definition' | 'formula' | 'insight';
  note?: string;
  isAI: boolean;
  pageIndex: number;
  createdAt: string;
}

export interface Flashcard {
  id: string;
  documentId: string;
  front: string;
  back: string;
  interval: number; // in days
  ease: number; // SM-2 ease factor (default starts at 2.5)
  repetitions: number; // consecutive correct reviews
  dueDate: string; // ISO date string
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  documentId: string;
  type: 'mcq' | 'short' | 'essay';
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options?: string[]; // for MCQ
  correctOption?: number; // for MCQ index
  referenceAnswer: string; // reference for grading
  userAnswer?: string;
  evaluation?: {
    score: number; // out of total marks
    feedback: string;
    modelAnswer: string;
  };
}

export interface StudySession {
  id: string;
  documentId: string;
  startTime: string;
  durationSeconds: number;
  cardsReviewed: number;
  questionsAnswered: number;
}

export interface Settings {
  geminiApiKey: string;
  topicMode: 'exam' | 'story' | 'concept';
  enableAIHighlighting: boolean;
  learnHighlightColors: boolean;
  preferredColors: {
    fact: 'yellow' | 'blue' | 'green' | 'purple';
    definition: 'yellow' | 'blue' | 'green' | 'purple';
    formula: 'yellow' | 'blue' | 'green' | 'purple';
    insight: 'yellow' | 'blue' | 'green' | 'purple';
  };
  spoilerProtection: boolean;
  speechRate: number;
  userName?: string;
  userGmail?: string;
  userPassword?: string;
}
