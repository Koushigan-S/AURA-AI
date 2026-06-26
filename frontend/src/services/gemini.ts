import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AuraDocument, AuraHighlight, Flashcard, QuizQuestion, Settings } from '../types';

// Standard mock data for Offline Demo Mode
const MOCK_TOPICS = {
  physics: 'Quantum Physics (Concept Mode)',
  history: 'The French Revolution (Exam Mode)',
  literature: 'The Great Gatsby (Story Mode - Spoiler Protected)'
};

const MOCK_SUMMARIES = {
  physics: `### Section 1: Wave-Particle Duality
- **Core Concept**: Electromagnetic radiation and matter exhibit both wave-like and particle-like properties depending on the experiment.
- **Equation**: De Broglie wavelength is expressed as $\\lambda = \\frac{h}{p}$, relating momentum ($p$) to wavelength.
- **Analogy**: Imagine a spinning coin. While spinning, it's a blur of both heads and tails (a wave of probabilities). Only when it lands (is measured) does it collapse into a single state (a particle).

### Section 2: Quantum Superposition
- **Definition**: A principle stating that physical systems can exist in multiple states or configurations simultaneously until measured.
- **Schrödinger's Cat**: A thought experiment illustrating the paradox of superposition. A cat in a sealed box is both alive and dead until the box is opened.`,
  
  history: `### Section 1: The Estates-General (May 1789)
- **Background**: King Louis XVI calls the assembly to solve the financial crisis.
- **The Conflict**: Third Estate (commoners) represents 98% of people but gets outvoted by First/Second Estates.
- **Outcome**: Third Estate breaks away to form the National Assembly.

### Section 2: Storming of the Bastille (July 14, 1789)
- **The Event**: Citizens storm the medieval fortress-prison Bastille for gunpowder and weapons.
- **Significance**: Symbolic collapse of absolute monarchy, sparking the wider revolution.`,
  
  literature: `### Section 1: Nick Carraway's Arrival in West Egg
- **Narrator**: Nick Carraway introduces himself as a non-judgmental observer.
- **Setting**: The contrast between East Egg (old money) and West Egg (new money).
- **Themes**: Loneliness, social stratification, the disillusionment of the American Dream.`
};

const MOCK_HIGHLIGHTS: Record<string, AuraHighlight[]> = {
  physics: [
    { id: 'h-1', text: 'Wave-Particle Duality', color: 'blue', type: 'definition', pageIndex: 0, createdAt: new Date().toISOString(), isAI: false },
    { id: 'h-2', text: 'de Broglie wavelength: \\lambda = h/p', color: 'green', type: 'formula', pageIndex: 0, createdAt: new Date().toISOString(), isAI: false },
    { id: 'h-3', text: 'systems can exist in multiple states simultaneously', color: 'yellow', type: 'fact', pageIndex: 1, createdAt: new Date().toISOString(), isAI: false }
  ],
  history: [
    { id: 'h-4', text: 'May 5, 1789', color: 'yellow', type: 'fact', pageIndex: 0, createdAt: new Date().toISOString(), isAI: false },
    { id: 'h-5', text: 'Third Estate represented 98% of the population', color: 'blue', type: 'definition', pageIndex: 0, createdAt: new Date().toISOString(), isAI: false },
    { id: 'h-6', text: 'July 14, 1789', color: 'yellow', type: 'fact', pageIndex: 1, createdAt: new Date().toISOString(), isAI: false }
  ],
  literature: [
    { id: 'h-7', text: 'West Egg and East Egg', color: 'purple', type: 'insight', pageIndex: 0, createdAt: new Date().toISOString(), isAI: false },
    { id: 'h-8', text: 'Nick Carraway', color: 'blue', type: 'definition', pageIndex: 0, createdAt: new Date().toISOString(), isAI: false },
    { id: 'h-9', text: 'green light at the end of the dock', color: 'purple', type: 'insight', pageIndex: 1, createdAt: new Date().toISOString(), isAI: false }
  ]
};

const MOCK_CARDS: Record<string, Omit<Flashcard, 'id' | 'documentId'>[]> = {
  physics: [
    { front: 'What is wave-particle duality?', back: 'The concept that all matter and light exhibit both wave-like and particle-like properties.', interval: 0, ease: 2.5, repetitions: 0, dueDate: new Date().toISOString(), createdAt: new Date().toISOString() },
    { front: 'State the de Broglie wavelength equation.', back: 'λ = h / p (where h is Planck\'s constant and p is momentum).', interval: 0, ease: 2.5, repetitions: 0, dueDate: new Date().toISOString(), createdAt: new Date().toISOString() }
  ],
  history: [
    { front: 'When was the Bastille stormed?', back: 'July 14, 1789.', interval: 0, ease: 2.5, repetitions: 0, dueDate: new Date().toISOString(), createdAt: new Date().toISOString() },
    { front: 'Why was the Third Estate dissatisfied with the Estates-General?', back: 'Despite representing 98% of the population, their vote was equal to the First or Second Estate, leading to them being constantly outvoted.', interval: 0, ease: 2.5, repetitions: 0, dueDate: new Date().toISOString(), createdAt: new Date().toISOString() }
  ],
  literature: [
    { front: 'Who is the narrator of The Great Gatsby?', back: 'Nick Carraway.', interval: 0, ease: 2.5, repetitions: 0, dueDate: new Date().toISOString(), createdAt: new Date().toISOString() },
    { front: 'What does East Egg symbolize in Chapter 1?', back: 'Old money, inherited wealth, social elitism, and moral decay.', interval: 0, ease: 2.5, repetitions: 0, dueDate: new Date().toISOString(), createdAt: new Date().toISOString() }
  ]
};

const MOCK_QUESTIONS: Record<string, Omit<QuizQuestion, 'id' | 'documentId'>[]> = {
  physics: [
    { type: 'mcq', marks: 2, difficulty: 'easy', question: 'Which parameter determines the de Broglie wavelength of an electron?', options: ['Temperature', 'Momentum', 'Volume', 'Charge'], correctOption: 1, referenceAnswer: 'Momentum determines it via λ = h/p.' },
    { type: 'short', marks: 3, difficulty: 'medium', question: 'Explain the concept of quantum superposition.', referenceAnswer: 'Quantum superposition states that a physical system remains in all possible states simultaneously until it interacts with the external world (is measured), at which point the wave function collapses.' }
  ],
  history: [
    { type: 'mcq', marks: 2, difficulty: 'easy', question: 'What was the French fortress-prison stormed on July 14, 1789?', options: ['Versailles', 'Bastille', 'Louvre', 'Tuileries'], correctOption: 1, referenceAnswer: 'The Bastille.' },
    { type: 'essay', marks: 5, difficulty: 'hard', question: 'Analyze the social and political factors leading to the call of the Estates-General in 1789.', referenceAnswer: 'Key factors include: France\'s financial bankruptcy from wars and royal excess, poor harvests leading to bread shortages, unequal taxation on the Third Estate, and absolute monarchy restricting representative governance.' }
  ],
  literature: [
    { type: 'mcq', marks: 2, difficulty: 'easy', question: 'How is Nick Carraway related to Daisy Buchanan?', options: ['Brother', 'Cousin once removed', 'Husband', 'College classmate'], correctOption: 1, referenceAnswer: 'Daisy is Nick\'s cousin once removed.' },
    { type: 'short', marks: 3, difficulty: 'medium', question: 'Describe the symbolic significance of the green light introduced in Chapter 1.', referenceAnswer: 'The green light represents Gatsby\'s hopes, dreams, and yearning for Daisy, as well as the elusive nature of the American Dream itself.' }
  ]
};

/**
 * Instantiates the Gemini client.
 */
function getGeminiClient(apiKey: string) {
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Detects the document topic and subject context.
 */
export async function detectTopic(content: string, settings: Settings): Promise<string> {
  const apiKey = settings.geminiApiKey;
  if (!apiKey) {
    // Offline mode: infer based on simple keyword search
    const lower = content.toLowerCase();
    if (lower.includes('quantum') || lower.includes('equation') || lower.includes('physics') || lower.includes('wave')) {
      return MOCK_TOPICS.physics;
    }
    if (lower.includes('revolution') || lower.includes('bastille') || lower.includes('estates') || lower.includes('king')) {
      return MOCK_TOPICS.history;
    }
    if (lower.includes('gatsby') || lower.includes('daisy') || lower.includes('west egg') || lower.includes('carraway')) {
      return MOCK_TOPICS.literature;
    }
    return 'General Academic Study';
  }

  try {
    const genAI = getGeminiClient(apiKey);
    const model = genAI!.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `Analyze the following academic document text. Detect and return ONLY the subject/topic context name in 3-5 words (e.g., "Introductory Quantum Mechanics", "18th Century European History", "Modernist American Literature").\n\nDocument Text Preview:\n${content.substring(0, 3000)}`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Gemini error detecting topic:', error);
    return 'General Study Guide';
  }
}

/**
 * Summarizes the document page-by-page or section-by-section.
 */
export async function summarizeContent(
  documentName: string,
  content: string,
  settings: Settings
): Promise<string> {
  const apiKey = settings.geminiApiKey;
  if (!apiKey) {
    const lower = documentName.toLowerCase();
    if (lower.includes('physics') || lower.includes('quantum')) return MOCK_SUMMARIES.physics;
    if (lower.includes('history') || lower.includes('revolution')) return MOCK_SUMMARIES.history;
    if (lower.includes('gatsby') || lower.includes('literature')) return MOCK_SUMMARIES.literature;
    return `### Executive Summary
- Core theme: General academic study guide.
- Key takeaway: This document contains study material.
- Details: Summarized in offline demo mode. Fill in your Gemini API key to activate live dynamic AI summaries!`;
  }

  try {
    const genAI = getGeminiClient(apiKey);
    const model = genAI!.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    let modeInstruction = '';
    if (settings.topicMode === 'exam') {
      modeInstruction = 'Create concise, highly dense exam study notes focusing on core facts, terminology, date/event details, and structural points.';
    } else if (settings.topicMode === 'story') {
      modeInstruction = 'Focus strictly on narrative themes, character motivations, literary devices, and character development. DO NOT summarize plot spoilers or key twist endings. Keep the literary critique spoiler-free.';
    } else {
      modeInstruction = 'Explain deep concepts with simple analogies, step-by-step math or logic breakdowns, and intuitive explanations.';
    }

    const prompt = `You are AURA, an expert academic tutor.
Summarize the academic text below using Markdown headings and bullets.
Format with clean sections.
Apply mode constraint: ${modeInstruction}

Document: ${documentName}
Content:
${content.substring(0, 8000)}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini error summarizing:', error);
    return 'Failed to generate summary. Please check your API key.';
  }
}

/**
 * Auto-highlight helper to return sections of text that should be highlighted.
 */
export async function generateAutoHighlights(
  content: string,
  settings: Settings
): Promise<{ text: string; type: 'fact' | 'definition' | 'formula' | 'insight'; color: 'yellow' | 'blue' | 'green' | 'purple' }[]> {
  const apiKey = settings.geminiApiKey;
  if (!apiKey) {
    const lower = content.toLowerCase();
    if (lower.includes('quantum') || lower.includes('wave')) {
      return MOCK_HIGHLIGHTS.physics.map(h => ({ text: h.text, type: h.type, color: h.color }));
    }
    if (lower.includes('revolution') || lower.includes('bastille')) {
      return MOCK_HIGHLIGHTS.history.map(h => ({ text: h.text, type: h.type, color: h.color }));
    }
    if (lower.includes('gatsby') || lower.includes('west egg')) {
      return MOCK_HIGHLIGHTS.literature.map(h => ({ text: h.text, type: h.type, color: h.color }));
    }
    return [];
  }

  try {
    const genAI = getGeminiClient(apiKey);
    const model = genAI!.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `You are AURA, an academic highlighting assistant. Analyze the text and identify key phrases that should be highlighted based on the study mode: "${settings.topicMode}".
Categorize each highlight as:
- 'fact' (color: 'yellow')
- 'definition' (color: 'blue')
- 'formula' (color: 'green', for equations/formulas)
- 'insight' (color: 'purple', for motifs/themes/literary analysis)

Return a JSON array of highlights containing exactly these keys: "text", "type", "color".
Only highlight exact substrings that appear literally in the text. Highlight between 3 and 10 items.

Text to highlight:
${content.substring(0, 5000)}`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    return parsed;
  } catch (error) {
    console.error('Gemini error highlighting:', error);
    return [];
  }
}

/**
 * Generates flashcards based on document content.
 */
export async function generateFlashcards(
  content: string,
  settings: Settings
): Promise<{ front: string; back: string }[]> {
  const apiKey = settings.geminiApiKey;
  if (!apiKey) {
    const lower = content.toLowerCase();
    if (lower.includes('quantum') || lower.includes('wave')) {
      return MOCK_CARDS.physics;
    }
    if (lower.includes('revolution') || lower.includes('bastille')) {
      return MOCK_CARDS.history;
    }
    if (lower.includes('gatsby') || lower.includes('west egg')) {
      return MOCK_CARDS.literature;
    }
    return [
      { front: 'Mock Question 1', back: 'Mock Answer 1. Set your Gemini API key for real generated flashcards!' },
      { front: 'Mock Question 2', back: 'Mock Answer 2. Dynamic generation takes place client-side.' }
    ];
  }

  try {
    const genAI = getGeminiClient(apiKey);
    const model = genAI!.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `You are AURA, an academic helper. Generate a list of 5-8 flashcards to help study this material.
Each flashcard must contain:
- "front": A clear, concise question or term prompt.
- "back": The concise explanation, definition, or answer.

Return as a JSON array of flashcards with keys "front" and "back".

Content:
${content.substring(0, 6000)}`;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error('Gemini error generating cards:', error);
    return [];
  }
}

/**
 * Generates quiz questions based on difficulty and content.
 */
export async function generateQuizQuestions(
  content: string,
  settings: Settings,
  pattern: string,
  pyqContent?: string
): Promise<Omit<QuizQuestion, 'id' | 'documentId'>[]> {
  const apiKey = settings.geminiApiKey;
  if (!apiKey) {
    const lower = content.toLowerCase();
    
    // Parse pattern to adjust counts dynamically
    let mcqCount = 2;
    let shortCount = 1;
    let essayCount = 1;

    const textToMatch = pyqContent ? pyqContent + " " + pattern : pattern;

    const mcqMatch = textToMatch.match(/(\d+)\s*(?:mcq|multiple|choice)/i);
    const shortMatch = textToMatch.match(/(\d+)\s*(?:short|3\s*mark)/i);
    const essayMatch = textToMatch.match(/(\d+)\s*(?:essay|5\s*mark|long)/i);

    if (mcqMatch) mcqCount = parseInt(mcqMatch[1]);
    if (shortMatch) shortCount = parseInt(shortMatch[1]);
    if (essayMatch) essayCount = parseInt(essayMatch[1]);

    const baseList = lower.includes('quantum') || lower.includes('wave')
      ? MOCK_QUESTIONS.physics 
      : (lower.includes('revolution') || lower.includes('bastille') ? MOCK_QUESTIONS.history : MOCK_QUESTIONS.literature);

    const generatedMockList: Omit<QuizQuestion, 'id' | 'documentId'>[] = [];
    
    // Grab templates from mock
    const mcqSource = baseList.find(q => q.type === 'mcq') || baseList[0];
    const shortSource = baseList.find(q => q.type === 'short') || baseList[1] || baseList[0];
    const essaySource = baseList.find(q => q.type === 'essay') || baseList[1] || baseList[0];

    // Build MCQ questions list
    for (let i = 0; i < mcqCount; i++) {
      generatedMockList.push({
        ...mcqSource,
        question: `${mcqSource.question.replace(/\s*\(Q\d+\)/, '')} (Q${i+1})`
      });
    }

    // Build Short Answer questions list
    for (let i = 0; i < shortCount; i++) {
      generatedMockList.push({
        ...shortSource,
        question: `${shortSource.question.replace(/\s*\(Q\d+\)/, '')} (Q${i+1})`
      });
    }

    // Build Essay questions list
    for (let i = 0; i < essayCount; i++) {
      generatedMockList.push({
        ...essaySource,
        question: `${essaySource.question.replace(/\s*\(Q\d+\)/, '')} (Q${i+1})`
      });
    }

    return generatedMockList;
  }

  try {
    const genAI = getGeminiClient(apiKey);
    const model = genAI!.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    let prompt = `You are AURA. Generate a customized mock quiz paper to test the user on the primary document content.`;

    if (pyqContent && pyqContent.trim()) {
      prompt += `\nWe have provided a Previous Year Question Paper (PYQ) as a reference template:
--- BEGIN PREVIOUS YEAR QUESTION PAPER ---
${pyqContent.substring(0, 6000)}
--- END PREVIOUS YEAR QUESTION PAPER ---

Carefully analyze the formatting style, question types (e.g. MCQ, short answer, essays), marks distribution, repeated concepts, difficulty, and tone of the Previous Year Question Paper.
Create a new mock examination paper covering the primary Syllabus Content below that mimics the layout, pattern, marks, and question formats of the Previous Year Question Paper as closely as possible.
If the Previous Year Question Paper highlights certain high-weightage topics that are also in the primary Syllabus Content, prioritize those topics to simulate repeated exam patterns. Make the mock test feel like a direct successor or parallel paper to the PYQ.`;
    } else {
      prompt += `\nGenerate exactly the count and types of questions requested in this pattern prompt: "${pattern}".`;
    }

    prompt += `\n\nReturn a JSON array of objects representing the quiz questions. Each object must have these keys:
- "type": "mcq" | "short" | "essay"
- "marks": number (custom mark value per question, e.g. 2 for MCQ, 3 for short, 5 for essay, or matching user's marks request)
- "difficulty": "easy" | "medium" | "hard" (inferred based on question depth)
- "question": string
- "options": array of strings (ONLY for "mcq", list exactly 4 choice options)
- "correctOption": number (ONLY for "mcq", 0-indexed index of correct choice)
- "referenceAnswer": string (Detailed ideal answer or answer key solution)

Syllabus Content:
${content.substring(0, 6000)}`;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error('Gemini error generating quiz:', error);
    return [];
  }
}

/**
 * Evaluates a student's answer against the reference answer.
 */
export async function evaluateAnswer(
  question: string,
  referenceAnswer: string,
  userAnswer: string,
  marks: number,
  settings: Settings
): Promise<{ score: number; feedback: string; modelAnswer: string }> {
  const apiKey = settings.geminiApiKey;
  if (!apiKey) {
    return {
      score: Math.min(marks, Math.floor(Math.random() * marks) + 1),
      feedback: 'Offline grading: Good effort. This is a mock grading. Setup your API key to get deep, context-aware evaluations from Gemini!',
      modelAnswer: referenceAnswer
    };
  }

  try {
    const genAI = getGeminiClient(apiKey);
    const model = genAI!.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `You are AURA, an academic grading assistant. Grade the student's answer.
Question: "${question}"
Max Marks: ${marks}
Ideal Reference Answer: "${referenceAnswer}"
Student's Answer: "${userAnswer}"

Grade objectively. Provide:
- "score": A score out of ${marks}.
- "feedback": Short constructive critique of what they hit, missed, and how to improve.
- "modelAnswer": A polished exemplary answer.

Return exactly a JSON object with keys "score", "feedback", and "modelAnswer".`;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error('Gemini grading error:', error);
    return {
      score: 0,
      feedback: 'Failed to grade answer due to API error.',
      modelAnswer: referenceAnswer
    };
  }
}

/**
 * Inline AI Chat Companion. Answers contextually.
 */
export async function answerChatQuestion(
  question: string,
  history: { role: 'user' | 'model'; parts: string }[],
  docContext: AuraDocument | null,
  settings: Settings
): Promise<string> {
  const apiKey = settings.geminiApiKey;
  if (!apiKey) {
    // Return simple local answers
    const q = question.toLowerCase();
    if (docContext) {
      if (q.includes('summary') || q.includes('summarize')) {
        return `Here is a quick summary of the active document **${docContext.name}**:\n\n${docContext.summary.substring(0, 400)}...\n\n*(Activate API key for dynamic queries)*`;
      }
      if (q.includes('page') || q.includes('chapter')) {
        return `The active document **${docContext.name}** has ${docContext.pages.length} pages. You are currently studying it under the **${settings.topicMode} Mode**.`;
      }
    }
    return `Hello! I am AURA. You are currently in offline demo mode. I can answer questions about quantum physics, the French Revolution, or The Great Gatsby.
To ask questions about your custom files, please enter your Gemini API key in Settings!`;
  }

  try {
    const genAI = getGeminiClient(apiKey);
    const model = genAI!.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let systemInstructions = `You are AURA (AI Understanding, Revision & Assistance), a helpful and premium academic companion.
You study in "${settings.topicMode}" mode. Keep your answers clear, visually structured, and direct.`;

    if (docContext) {
      systemInstructions += `\nYou are answering questions about the active document: "${docContext.name}" (Subject: ${docContext.topicContext}).
Use the following text as the absolute ground truth reference:
--- BEGIN DOCUMENT CONTEXT ---
${docContext.content.substring(0, 10000)}
--- END DOCUMENT CONTEXT ---
If the answer cannot be found in the document, use your broad academic knowledge but clarify that it is not explicitly mentioned in the text.`;
    }

    const chatSession = model.startChat({
      history: history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.parts }]
      })),
      systemInstruction: systemInstructions
    });

    const result = await chatSession.sendMessage(question);
    return result.response.text();
  } catch (error) {
    console.error('Gemini chat error:', error);
    return 'Sorry, I encountered an issue answering your question. Please verify your internet connection or API key.';
  }
}

/**
 * Auto-Enrich Pasted Notes.
 */
export async function autoEnrichNotes(
  currentSummary: string,
  newNotes: string,
  settings: Settings
): Promise<string> {
  const apiKey = settings.geminiApiKey;
  if (!apiKey) {
    return `${currentSummary}\n\n### Merged & Enriched Note (Offline Mock)
${newNotes}
- *Auto-Enrichment*: Add real-world example here. (Example: In physics, superposition is key to quantum computers like Qubits representing both 0 and 1).`;
  }

  try {
    const genAI = getGeminiClient(apiKey);
    const model = genAI!.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are AURA, an academic writing assistant.
We have an existing study summary:
---
${currentSummary}
---
The student wants to merge the following new notes or thoughts:
---
${newNotes}
---
Please merge the new notes into the existing summary seamlessly.
Under an "Auto-Enrich" header or embedded context, provide:
1. Additional context or background information.
2. An illustrative analogy or practical real-world example to make the concept easier to grasp.

Format using clean Markdown.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini notes enrichment error:', error);
    return `${currentSummary}\n\n### Merged Note\n${newNotes}`;
  }
}

/**
 * Verifies if the Gemini API Key is valid by making a lightweight test query.
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  if (!apiKey || !apiKey.trim()) return false;
  try {
    const genAI = getGeminiClient(apiKey.trim());
    if (!genAI) return false;
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Ping' }] }],
      generationConfig: { maxOutputTokens: 5 }
    });
    return !!result.response.text();
  } catch (error) {
    console.error('Gemini API key validation failed:', error);
    return false;
  }
}

