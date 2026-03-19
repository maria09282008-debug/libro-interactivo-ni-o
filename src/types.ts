export interface Activity {
  id: string;
  title: string;
  description: string;
  duration: string;
  material: string;
  day: number;
}

export interface Week {
  number: number;
  title: string;
  activities: Activity[];
}

export interface Phase {
  id: number;
  title: string;
  subtitle: string;
  focus: string;
  weeks: Week[];
  description: string;
  learningGoals: string[];
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  sections?: {
    title: string;
    content: string;
  }[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface GlossaryItem {
  term: string;
  definition: string;
}

export interface BookContent {
  introduction: {
    title: string;
    content: string;
  };
  chapters: Chapter[];
  phases: Phase[];
  wordLists: {
    phase2: string[];
    phase3: string[];
    highFrequency: string[];
    fluencyPhrases?: string[];
  };
  stories: {
    title: string;
    content: string[];
    questions?: string[];
  }[];
  faq: FAQItem[];
  glossary: GlossaryItem[];
  scientificBasis: {
    title: string;
    content: string;
    references: string[];
  };
  milestones?: {
    month: string;
    goal: string;
  }[];
  specialSounds?: {
    digraph: string;
    sound: string;
    examples: string;
    howToTeach: string;
  }[];
  finalWord?: {
    title: string;
    content: string;
  };
}
