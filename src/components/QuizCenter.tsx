import React, { useState, useRef } from 'react';
import type { AuraDocument, QuizQuestion, Settings } from '../types';
import { generateQuizQuestions, evaluateAnswer } from '../services/gemini';
import { Sparkles, AlertCircle, Send, Save, Download, FileText, Trash2 } from 'lucide-react';
import { processFile } from '../services/docParser';

interface QuizCenterProps {
  documents: AuraDocument[];
  questions: QuizQuestion[];
  setQuestions: (qs: QuizQuestion[]) => void;
  settings: Settings;
}

export const QuizCenter: React.FC<QuizCenterProps> = ({
  documents,
  questions,
  setQuestions,
  settings,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'take' | 'history'>('take');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [pattern, setPattern] = useState<string>('10 MCQs and two 5-mark questions');
  
  // PYQ upload state
  const [pyqFile, setPyqFile] = useState<File | null>(null);
  const [pyqContent, setPyqContent] = useState<string>('');
  const [pyqLoading, setPyqLoading] = useState<boolean>(false);
  const [pyqError, setPyqError] = useState<string | null>(null);
  const pyqInputRef = useRef<HTMLInputElement>(null);

  // Quiz taking state
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState<QuizQuestion[]>([]);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [essayAnswers, setEssayAnswers] = useState<Record<string, string>>({});
  const [evaluatingIds, setEvaluatingIds] = useState<Record<string, boolean>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);

  const activeDoc = documents.find(d => d.id === selectedDocId) || null;

  const triggerGenerateQuiz = async () => {
    if (!activeDoc) return;
    setLoading(true);
    setQuizStarted(false);
    setSubmittedQuiz(false);
    setMcqAnswers({});
    setEssayAnswers({});

    try {
      const generated = await generateQuizQuestions(activeDoc.content, settings, pattern, pyqContent);
      const mapped: QuizQuestion[] = generated.map((q, idx) => ({
        ...q,
        id: `q-${Date.now()}-${idx}`,
        documentId: activeDoc.id
      }));
      setCurrentQuestions(mapped);
      setQuizStarted(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePyqUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPyqError(null);
    setPyqLoading(true);
    try {
      const parsed = await processFile(file);
      setPyqFile(file);
      setPyqContent(parsed.content);
    } catch (err: any) {
      console.error(err);
      setPyqError(err.message || 'Failed to parse reference paper.');
    } finally {
      setPyqLoading(false);
      if (pyqInputRef.current) pyqInputRef.current.value = '';
    }
  };

  const handleClearPyq = () => {
    setPyqFile(null);
    setPyqContent('');
    setPyqError(null);
  };

  const handleExportPaper = (isAnswerKey: boolean) => {
    if (!activeDoc || currentQuestions.length === 0) return;

    const title = activeDoc.name.replace(/\.[^/.]+$/, "");
    const dateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${isAnswerKey ? 'Answer Key' : 'Question Paper'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    :root {
      --bg-color: #0a0a0c;
      --card-bg: #161618;
      --text-main: #f5f5f7;
      --text-muted: #86868b;
      --accent: #0071e3;
      --border: rgba(255, 255, 255, 0.08);
      --success: #30d158;
    }

    @media print {
      :root {
        --bg-color: #ffffff;
        --card-bg: #ffffff;
        --text-main: #000000;
        --text-muted: #555555;
        --accent: #000000;
        --border: #dddddd;
      }
      body {
        background-color: #ffffff !important;
        color: #000000 !important;
        padding: 20px !important;
      }
      .question-card {
        page-break-inside: avoid;
        border: 1px solid #dddddd !important;
        background: #ffffff !important;
        box-shadow: none !important;
        margin-bottom: 20px !important;
      }
      .no-print {
        display: none !important;
      }
      .print-btn {
        display: none !important;
      }
    }

    body {
      background-color: var(--bg-color);
      color: var(--text-main);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 40px 24px;
      line-height: 1.6;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 24px;
      margin-bottom: 40px;
    }

    .doc-type {
      text-transform: uppercase;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: var(--accent);
    }

    h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 8px 0 6px 0;
      letter-spacing: -0.5px;
    }

    .metadata {
      font-size: 13px;
      color: var(--text-muted);
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .question-card {
      background-color: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    }

    .question-header {
      display: flex;
      justify-content: justify;
      align-items: center;
      margin-bottom: 14px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      padding-bottom: 8px;
    }

    .question-num {
      font-size: 12px;
      font-weight: 700;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .question-marks {
      font-size: 11px;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      padding: 4px 8px;
      border-radius: 6px;
      color: var(--text-muted);
      margin-left: auto;
    }

    .question-text {
      font-size: 16px;
      font-weight: 500;
      margin: 0 0 18px 0;
    }

    .options-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 16px;
    }

    .option-item {
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid var(--border);
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255, 255, 255, 0.01);
    }

    .option-letter {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.02);
      flex-shrink: 0;
    }

    .option-item.correct {
      border-color: var(--success);
      background: rgba(48, 209, 88, 0.1);
      color: #e3ffd8;
    }
    .option-item.correct .option-letter {
      border-color: var(--success);
      background: var(--success);
      color: #000000;
    }

    .answer-section {
      margin-top: 18px;
      padding-top: 16px;
      border-top: 1px dashed var(--border);
    }

    .answer-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--success);
      margin-bottom: 6px;
    }

    .answer-body {
      font-size: 14px;
      color: #e5e5ea;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border);
      padding: 12px 16px;
      border-radius: 8px;
      font-style: italic;
    }

    .print-bar {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 100;
    }

    .print-btn {
      background-color: var(--accent);
      color: white;
      border: none;
      border-radius: 50px;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0, 113, 227, 0.35);
      transition: transform 0.2s, opacity 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .print-btn:hover {
      transform: translateY(-2px);
      opacity: 0.95;
    }
  </style>
</head>
<body>
  <div class="print-bar no-print">
    <button class="print-btn" onclick="window.print()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
      </svg>
      Print Document
    </button>
  </div>

  <div class="container">
    <header>
      <div class="doc-type">${isAnswerKey ? 'Official Answer Key' : 'Question Practice Paper'}</div>
      <h1>${title}</h1>
      <div class="metadata">
        <span><strong>Subject:</strong> ${activeDoc.topicContext}</span>
        <span><strong>Structure:</strong> ${pattern}</span>
        <span><strong>Date:</strong> ${dateStr}</span>
      </div>
    </header>

    <main>
`;

    currentQuestions.forEach((q, idx) => {
      htmlContent += `
      <div class="question-card">
        <div class="question-header">
          <div class="question-num">Question ${idx + 1} &bull; ${q.type}</div>
          <div class="question-marks">${q.marks} Mark${q.marks > 1 ? 's' : ''}</div>
        </div>
        <p class="question-text">${q.question}</p>
      `;

      if (q.type === 'mcq' && q.options) {
        htmlContent += `<div class="options-list">`;
        q.options.forEach((opt, oIdx) => {
          const isCorrect = q.correctOption === oIdx;
          const optionClass = isAnswerKey && isCorrect ? 'option-item correct' : 'option-item';
          htmlContent += `
          <div class="${optionClass}">
            <div class="option-letter">${String.fromCharCode(65 + oIdx)}</div>
            <div>${opt}</div>
          </div>
          `;
        });
        htmlContent += `</div>`;
      } else if (!isAnswerKey) {
        const linesCount = q.type === 'short' ? 4 : 10;
        htmlContent += `<div style="margin-top: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); height: ${linesCount * 24}px; background-image: linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px); background-size: 100% 24px;"></div>`;
      }

      if (isAnswerKey) {
        htmlContent += `
        <div class="answer-section">
          <div class="answer-title">Answer Key Reference</div>
          <div class="answer-body">${q.referenceAnswer}</div>
        </div>
        `;
      }

      htmlContent += `</div>`;
    });

    htmlContent += `
    </main>
  </div>
</body>
</html>
`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${isAnswerKey ? 'answer_key' : 'question_paper'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  const handleEvaluateEssay = async (qId: string) => {
    const question = currentQuestions.find(q => q.id === qId);
    const answerText = essayAnswers[qId];
    if (!question || !answerText || !answerText.trim()) return;

    setEvaluatingIds(prev => ({ ...prev, [qId]: true }));
    try {
      const result = await evaluateAnswer(
        question.question,
        question.referenceAnswer,
        answerText,
        question.marks,
        settings
      );

      const updated = currentQuestions.map(q => {
        if (q.id === qId) {
          return {
            ...q,
            userAnswer: answerText,
            evaluation: result
          };
        }
        return q;
      });

      setCurrentQuestions(updated);
    } catch (error) {
      console.error(error);
    } finally {
      setEvaluatingIds(prev => ({ ...prev, [qId]: false }));
    }
  };

  const handleSubmitMcqs = () => {
    // Grade MCQ answers
    const updated = currentQuestions.map(q => {
      if (q.type === 'mcq') {
        const userSel = mcqAnswers[q.id];
        const isCorrect = userSel === q.correctOption;
        return {
          ...q,
          userAnswer: userSel !== undefined ? q.options![userSel] : 'Unanswered',
          evaluation: {
            score: isCorrect ? q.marks : 0,
            feedback: isCorrect ? 'Correct!' : `Incorrect. The correct option was option index ${q.correctOption}: "${q.options![q.correctOption!]}"`,
            modelAnswer: q.options![q.correctOption!]
          }
        };
      }
      return q;
    });

    setCurrentQuestions(updated);
    setSubmittedQuiz(true);
  };

  const handleSaveToHistory = () => {
    // Save current evaluated questions to master list in state
    setQuestions([...questions, ...currentQuestions]);
    setQuizStarted(false);
    setCurrentQuestions([]);
    setSubmittedQuiz(false);
    setMcqAnswers({});
    setEssayAnswers({});
    setActiveTab('history');
  };

  const totalScore = currentQuestions.reduce((sum, q) => sum + (q.evaluation?.score || 0), 0);
  const maxScore = currentQuestions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <div className="w-full h-full p-8 overflow-y-auto space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Quiz Center</h2>
          <p className="text-apple-gray text-sm mt-1">Adaptive testing and dynamic context grading.</p>
        </div>

        {/* Tab triggers */}
        <div className="flex gap-2 p-1 bg-white/5 border border-white/5 rounded-lg">
          <button
            onClick={() => setActiveTab('take')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold apple-transition ${
              activeTab === 'take' ? 'bg-apple-blue text-white' : 'text-apple-gray hover:text-white'
            }`}
          >
            Practice Exam
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold apple-transition ${
              activeTab === 'history' ? 'bg-apple-blue text-white' : 'text-apple-gray hover:text-white'
            }`}
          >
            Revision Papers ({questions.length})
          </button>
        </div>
      </div>

      {activeTab === 'take' ? (
        <div className="space-y-6">
          {/* Setup controls */}
          {!quizStarted && (
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl max-w-xl mx-auto space-y-6">
              <h3 className="text-base font-semibold text-white">Generate Mock Practice Paper</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-apple-gray mb-2">Select Study Document</label>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="w-full bg-apple-black/40 border border-white/10 rounded-lg text-xs font-semibold px-3 py-2.5 text-white outline-none cursor-pointer"
                  >
                    <option value="all" disabled>Select a Document...</option>
                    {documents.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-apple-gray mb-2">Test Difficulty Level</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['easy', 'medium', 'hard'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`py-2 rounded-lg text-xs font-semibold uppercase border apple-transition ${
                          difficulty === d
                            ? 'border-apple-blue bg-apple-blue/10 text-white'
                            : 'border-white/5 bg-white/5 text-apple-gray hover:bg-white/10'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-apple-gray mb-2">Question Paper Pattern</label>
                  <textarea
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    placeholder="e.g. 10 MCQs and two 5-mark questions"
                    rows={2}
                    className="w-full bg-apple-black/40 border border-white/10 rounded-lg text-xs p-3 text-white focus:outline-none focus:ring-1 focus:ring-apple-blue focus:border-apple-blue placeholder:text-apple-gray/30 leading-relaxed resize-none"
                  />
                  <span className="block text-[10px] text-apple-gray mt-1">
                    Describe your custom structure (e.g. "5 MCQs, 2 short answer, and 1 essay question").
                  </span>
                </div>

                <div className="pt-3 border-t border-white/5 space-y-3">
                  <label className="block text-xs font-medium text-apple-gray">
                    Reference Previous Year Paper (Optional)
                  </label>
                  <input
                    type="file"
                    ref={pyqInputRef}
                    onChange={handlePyqUpload}
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                  />
                  
                  {pyqFile ? (
                    <div className="flex items-center justify-between p-3 bg-apple-blue/5 border border-apple-blue/20 rounded-xl">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-apple-blue shrink-0" />
                        <span className="text-xs text-white truncate font-medium">{pyqFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearPyq}
                        className="p-1 rounded-lg hover:bg-white/5 text-apple-gray hover:text-white apple-transition cursor-pointer"
                        title="Remove paper"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => pyqInputRef.current?.click()}
                      disabled={pyqLoading}
                      className="w-full py-4 border border-dashed border-white/10 hover:border-white/20 rounded-xl bg-white/[0.01] hover:bg-white/[0.02] text-xs font-medium text-apple-gray hover:text-white/90 apple-transition flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span>{pyqLoading ? 'Extracting text...' : 'Upload Previous Year Question Paper (PDF, DOCX, TXT)'}</span>
                    </button>
                  )}
                  {pyqError && <span className="block text-[10px] text-red-400 mt-1">{pyqError}</span>}
                  {!pyqFile && (
                    <span className="block text-[10px] text-apple-gray/50">
                      Provide a reference exam paper to analyze repeated topics and match the layout.
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={triggerGenerateQuiz}
                disabled={loading || selectedDocId === 'all'}
                className="w-full py-2.5 bg-gradient-to-r from-apple-blue to-purple-600 hover:from-apple-blue/90 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {loading ? 'Compiling syllabus questions...' : 'Generate Practice Test'}
              </button>
            </div>
          )}

          {/* Active Quiz Sheet */}
          {quizStarted && currentQuestions.length > 0 && (
            <div className="space-y-8 max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/5 border border-white/5 p-4 rounded-xl gap-4">
                <div>
                  <span className="text-[10px] text-apple-blue uppercase tracking-wider font-semibold">Active Syllabus Test</span>
                  <h4 className="text-xs font-semibold text-white/95 truncate mt-1 max-w-[200px] sm:max-w-xs">
                    Based on: {activeDoc?.name}
                  </h4>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleExportPaper(false)}
                    className="py-1.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold rounded-lg text-white/95 apple-transition flex items-center gap-1.5 cursor-pointer"
                    title="Download blank printable question paper"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Paper
                  </button>
                  <button
                    onClick={() => handleExportPaper(true)}
                    className="py-1.5 px-3 bg-apple-blue/10 hover:bg-apple-blue/20 border border-apple-blue/20 text-xs font-semibold rounded-lg text-apple-blue apple-transition flex items-center gap-1.5 cursor-pointer"
                    title="Download questions with reference answers"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Answer Key
                  </button>
                  {submittedQuiz && (
                    <div className="text-right border-l border-white/10 pl-3 ml-1">
                      <span className="text-[10px] text-apple-gray uppercase block">Final Score</span>
                      <span className="text-sm font-bold text-green-400">{totalScore} / {maxScore}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-6">
                {currentQuestions.map((q, idx) => (
                  <div key={q.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-apple-blue font-bold">Question {idx + 1} <span className="text-[10px] text-apple-gray font-normal">({q.type.toUpperCase()})</span></span>
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-bold text-apple-gray">{q.marks} Mark{q.marks > 1 ? 's' : ''}</span>
                    </div>

                    <p className="text-sm font-medium text-white">{q.question}</p>

                    {/* MCQ Layout */}
                    {q.type === 'mcq' && (
                      <div className="space-y-2 pt-2">
                        {q.options?.map((opt, oIdx) => {
                          const isSelected = mcqAnswers[q.id] === oIdx;
                          const showCorrect = q.evaluation !== undefined;
                          const isCorrect = q.correctOption === oIdx;
                          
                          return (
                            <button
                              key={oIdx}
                              disabled={showCorrect}
                              onClick={() => setMcqAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                              className={`w-full text-left p-3 rounded-lg border text-xs apple-transition flex items-center gap-3 ${
                                showCorrect
                                  ? isCorrect
                                    ? 'border-green-500 bg-green-500/10 text-green-200 font-medium'
                                    : isSelected
                                      ? 'border-red-500 bg-red-500/10 text-red-200'
                                      : 'border-white/5 bg-white/5 text-apple-gray'
                                  : isSelected
                                    ? 'border-apple-blue bg-apple-blue/5 text-white'
                                    : 'border-white/5 bg-white/[0.02] hover:bg-white/5 text-white/80'
                              }`}
                            >
                              <span className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Short & Essay Text Inputs */}
                    {q.type !== 'mcq' && (
                      <div className="space-y-4">
                        <textarea
                          disabled={q.evaluation !== undefined}
                          value={essayAnswers[q.id] || ''}
                          onChange={(e) => setEssayAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="Type your response here..."
                          rows={q.type === 'short' ? 3 : 5}
                          className="w-full bg-apple-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-apple-blue focus:border-apple-blue placeholder:text-apple-gray/40 leading-relaxed"
                        />
                        
                        {q.evaluation === undefined ? (
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleEvaluateEssay(q.id)}
                              disabled={evaluatingIds[q.id] || !essayAnswers[q.id]?.trim()}
                              className="py-1.5 px-3 bg-white/5 hover:bg-white/10 border border-white/5 text-white text-xs rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-40"
                            >
                              <Send className="w-3 h-3" />
                              {evaluatingIds[q.id] ? 'AI Evaluation in progress...' : 'Evaluate Answer'}
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 rounded-xl space-y-3 font-sans">
                            <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-2">
                              <span className="text-apple-blue font-bold">Grade score: <span className="text-green-400 font-bold text-xs">{q.evaluation.score} / {q.marks} Marks</span></span>
                              <span className="text-apple-gray font-medium">AURA Evaluation</span>
                            </div>
                            <div>
                              <span className="block text-[9px] uppercase font-semibold text-apple-gray">Feedback</span>
                              <p className="text-xs text-white/90 leading-relaxed mt-1">{q.evaluation.feedback}</p>
                            </div>
                            <div>
                              <span className="block text-[9px] uppercase font-semibold text-apple-gray">Model Answer</span>
                              <p className="text-xs text-apple-gray leading-relaxed mt-1 italic">"{q.evaluation.modelAnswer}"</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit panel */}
              <div className="flex justify-between items-center bg-white/5 border border-white/5 p-4 rounded-xl">
                <div>
                  <p className="text-xs text-apple-gray">Make sure all questions are finished before saving.</p>
                </div>
                <div className="flex gap-2">
                  {!submittedQuiz && currentQuestions.some(q => q.type === 'mcq') && (
                    <button
                      onClick={handleSubmitMcqs}
                      className="py-2 px-4 bg-apple-blue hover:bg-apple-blue/90 text-white rounded-lg text-xs font-semibold"
                    >
                      Grade MCQ Questions
                    </button>
                  )}
                  <button
                    onClick={handleSaveToHistory}
                    className="py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Paper
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl mx-auto">
          {/* History */}
          <h3 className="text-lg font-semibold text-white mb-4">Completed Practice Sets</h3>
          {questions.length === 0 ? (
            <div className="text-center py-12 border border-white/5 rounded-2xl bg-white/[0.01]">
              <AlertCircle className="w-10 h-10 text-apple-gray/20 mx-auto mb-3" />
              <p className="text-sm text-apple-gray">No revision papers saved yet. Complete a practice exam to save history.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={idx} className="p-5 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-apple-blue uppercase font-bold tracking-wider">{q.type}</span>
                    <span className="font-semibold text-green-400">{q.evaluation?.score} / {q.marks} Marks</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white leading-relaxed">{q.question}</h4>
                  <p className="text-xs text-apple-gray mt-1 leading-relaxed"><span className="font-semibold text-white/80">Your Response:</span> "{q.userAnswer}"</p>
                  {q.evaluation?.feedback && (
                    <p className="text-xs text-purple-300 bg-purple-950/20 p-2.5 rounded-lg border border-purple-500/10 mt-2 font-sans leading-relaxed">
                      💡 **Feedback**: {q.evaluation.feedback}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
