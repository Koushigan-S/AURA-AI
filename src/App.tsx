import { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { AuraDocument, Flashcard, QuizQuestion, Settings } from './types';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { DocViewer } from './components/DocViewer';
import { ChatPanel } from './components/ChatPanel';
import { StudyDeck } from './components/StudyDeck';
import { QuizCenter } from './components/QuizCenter';
import { TimelineVisualizer } from './components/TimelineVisualizer';
import { NotesManager } from './components/NotesManager';
import { SettingsPanel } from './components/SettingsPanel';
import { SkillStatus } from './components/SkillStatus';
import { Preloader } from './components/Preloader';
import { Login } from './components/Login';
import { AnimatePresence } from 'framer-motion';

const DEFAULT_SETTINGS: Settings = {
  geminiApiKey: '',
  topicMode: 'exam',
  enableAIHighlighting: true,
  learnHighlightColors: true,
  preferredColors: {
    fact: 'yellow',
    definition: 'blue',
    formula: 'green',
    insight: 'purple',
  },
  spoilerProtection: true,
  speechRate: 1.0,
  userName: '',
  userGmail: '',
  userPassword: '',
};

function App() {
  const [loadingApp, setLoadingApp] = useState(true);
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingApp(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);
  const [documents, setDocuments] = useLocalStorage<AuraDocument[]>('aura_documents', []);
  const [flashcards, setFlashcards] = useLocalStorage<Flashcard[]>('aura_flashcards', []);
  const [questions, setQuestions] = useLocalStorage<QuizQuestion[]>('aura_questions', []);
  const [settings, setSettings] = useLocalStorage<Settings>('aura_settings', DEFAULT_SETTINGS);
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage<boolean>('aura_logged_in', false);
  const [selectedDoc, setSelectedDoc] = useState<AuraDocument | null>(() => {
    return documents.length > 0 ? documents[0] : null;
  });

  // Number of reviews pending today
  const pendingReviewsCount = flashcards.filter(
    (card) => new Date(card.dueDate) <= new Date()
  ).length;

  const [isIndexCollapsed, setIsIndexCollapsed] = useState<boolean>(false);
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState<boolean>(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState<boolean>(false);

  return (
    <div className="w-screen h-screen bg-apple-black flex text-white overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {loadingApp && <Preloader />}
      </AnimatePresence>

      {!loadingApp && (
        !isLoggedIn ? (
          <Login
            settings={settings}
            setSettings={setSettings}
            onLoginSuccess={() => setIsLoggedIn(true)}
          />
        ) : (
          <>
            {/* Sidebar Navigation */}
            <Sidebar
              activeView={activeView}
              setActiveView={setActiveView}
              documentCount={documents.length}
              reviewCount={pendingReviewsCount}
              isCollapsed={isSidebarCollapsed}
              setIsCollapsed={setIsSidebarCollapsed}
              onLogout={() => setIsLoggedIn(false)}
            />

            {/* Main Workspace Frame */}
            <main className="flex-1 flex overflow-hidden h-full">
              <div className="flex-1 flex flex-col overflow-hidden h-full bg-black">
          {activeView === 'dashboard' && (
            <Dashboard
              documents={documents}
              setDocuments={setDocuments}
              selectedDoc={selectedDoc}
              setSelectedDoc={setSelectedDoc}
              setActiveView={setActiveView}
              settings={settings}
              flashcardCount={flashcards.length}
            />
          )}

          {activeView === 'reader' && (
            <div className="flex-1 flex overflow-hidden h-full">
              <DocViewer
                document={selectedDoc}
                setDocuments={setDocuments}
                documents={documents}
                settings={settings}
                setSettings={setSettings}
                isIndexCollapsed={isIndexCollapsed}
                setIsIndexCollapsed={setIsIndexCollapsed}
                isSummaryCollapsed={isSummaryCollapsed}
                setIsSummaryCollapsed={setIsSummaryCollapsed}
                isChatCollapsed={isChatCollapsed}
                setIsChatCollapsed={setIsChatCollapsed}
              />
              {!isChatCollapsed && (
                <ChatPanel
                  document={selectedDoc}
                  settings={settings}
                  onClose={() => setIsChatCollapsed(true)}
                />
              )}
            </div>
          )}

          {activeView === 'skills' && (
            <SkillStatus
              documents={documents}
              flashcards={flashcards}
              questions={questions}
              settings={settings}
            />
          )}

          {activeView === 'flashcards' && (
            <StudyDeck
              documents={documents}
              flashcards={flashcards}
              setFlashcards={setFlashcards}
              settings={settings}
            />
          )}

          {activeView === 'quizzes' && (
            <QuizCenter
              documents={documents}
              questions={questions}
              setQuestions={setQuestions}
              settings={settings}
            />
          )}

          {activeView === 'visualizer' && (
            <TimelineVisualizer document={selectedDoc} />
          )}

          {activeView === 'notes' && (
            <NotesManager
              documents={documents}
              setDocuments={setDocuments}
              settings={settings}
            />
          )}

          {activeView === 'settings' && (
            <div className="w-full h-full overflow-y-auto p-6 md:p-8 flex flex-col items-center justify-start">
              <SettingsPanel settings={settings} setSettings={setSettings} />
            </div>
          )}
        </div>
      </main>
          </>
        )
      )}
    </div>
  );
}

export default App;
