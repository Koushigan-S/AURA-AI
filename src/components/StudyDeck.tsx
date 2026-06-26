import React, { useState, useEffect } from 'react';
import type { AuraDocument, Flashcard, Settings } from '../types';
import { generateFlashcards } from '../services/gemini';
import { Sparkles, CheckCircle2, Download, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface StudyDeckProps {
  documents: AuraDocument[];
  flashcards: Flashcard[];
  setFlashcards: (cards: Flashcard[]) => void;
  settings: Settings;
}

export const StudyDeck: React.FC<StudyDeckProps> = ({
  documents,
  flashcards,
  setFlashcards,
  settings,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedTodayCount, setReviewedTodayCount] = useState(0);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    setActiveCardIndex(0);
    setIsFlipped(false);
  }, [selectedDocId]);

  // Filter cards due today
  const dueCards = flashcards.filter((card) => {
    if (selectedDocId !== 'all' && card.documentId !== selectedDocId) return false;
    return new Date(card.dueDate) <= new Date();
  });

  const activeCard = dueCards[activeCardIndex] || null;

  const triggerGenerate = async () => {
    if (selectedDocId === 'all') return;
    const doc = documents.find(d => d.id === selectedDocId);
    if (!doc) return;

    setLoading(true);
    try {
      const generated = await generateFlashcards(doc.content, settings);
      const newCards: Flashcard[] = generated.map((c, i) => ({
        id: `card-${Date.now()}-${i}`,
        documentId: doc.id,
        front: c.front,
        back: c.back,
        interval: 0,
        ease: 2.5,
        repetitions: 0,
        dueDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }));

      // Filter duplicates
      const filtered = newCards.filter(nc => !flashcards.some(fc => fc.front.toLowerCase() === nc.front.toLowerCase()));
      setFlashcards([...flashcards, ...filtered]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSM2Review = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!activeCard) return;

    let newInterval = activeCard.interval;
    let newEase = activeCard.ease;
    let newRepetitions = activeCard.repetitions;

    if (rating === 'again') {
      newRepetitions = 0;
      newInterval = 1;
      newEase = Math.max(1.3, activeCard.ease - 0.2);
    } else if (rating === 'hard') {
      newRepetitions = Math.max(0, activeCard.repetitions - 1);
      newInterval = newRepetitions <= 1 ? 1 : newRepetitions === 2 ? 3 : Math.floor(activeCard.interval * 1.2);
      newEase = Math.max(1.3, activeCard.ease - 0.15);
    } else if (rating === 'good') {
      newRepetitions += 1;
      newInterval = newRepetitions === 1 ? 1 : newRepetitions === 2 ? 6 : Math.floor(activeCard.interval * activeCard.ease);
    } else if (rating === 'easy') {
      newRepetitions += 1;
      newInterval = newRepetitions === 1 ? 2 : newRepetitions === 2 ? 8 : Math.floor(activeCard.interval * activeCard.ease * 1.3);
      newEase = activeCard.ease + 0.15;
    }

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + newInterval);

    const updated = flashcards.map((fc) => {
      if (fc.id === activeCard.id) {
        return {
          ...fc,
          interval: newInterval,
          ease: newEase,
          repetitions: newRepetitions,
          dueDate: nextDueDate.toISOString(),
        };
      }
      return fc;
    });

    setFlashcards(updated);
    setIsFlipped(false);
    setReviewedTodayCount((prev) => prev + 1);

    // Slide to next card
    if (activeCardIndex < dueCards.length - 1) {
      // stay at same index because item will be removed from due list once synced
    }
  };

  const exportDeck = (format: 'json' | 'csv') => {
    const activeDocCards = flashcards.filter(c => selectedDocId === 'all' || c.documentId === selectedDocId);
    if (format === 'json') {
      const dataStr = JSON.stringify(activeDocCards, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `aura_flashcards_${selectedDocId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const csvRows = ['front,back'];
      activeDocCards.forEach(c => {
        // Escape quotes
        const f = c.front.replace(/"/g, '""');
        const b = c.back.replace(/"/g, '""');
        csvRows.push(`"${f}","${b}"`);
      });
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `aura_flashcards_${selectedDocId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim() || selectedDocId === 'all') return;

    const newCard: Flashcard = {
      id: `card-manual-${Date.now()}`,
      documentId: selectedDocId,
      front: newFront,
      back: newBack,
      interval: 0,
      ease: 2.5,
      repetitions: 0,
      dueDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setFlashcards([...flashcards, newCard]);
    setNewFront('');
    setNewBack('');
    setShowAddForm(false);
  };

  return (
    <div className="w-full h-full p-8 overflow-y-auto space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Active Flashcards</h2>
          <p className="text-apple-gray text-sm mt-1">Anki-style review engine built on spaced repetition logic.</p>
        </div>

        <div className="flex gap-2">
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg text-xs font-semibold px-3 py-2 text-white outline-none cursor-pointer"
          >
            <option value="all" className="bg-apple-dark">All Documents</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id} className="bg-apple-dark">{d.name}</option>
            ))}
          </select>

          {selectedDocId !== 'all' && (
            <>
              <button
                onClick={triggerGenerate}
                disabled={loading}
                className="py-2 px-3 bg-gradient-to-r from-apple-blue to-purple-600 hover:from-apple-blue/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {loading ? 'Generating...' : 'Auto-Build Cards'}
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="py-2 px-3 bg-white/5 border border-white/5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 hover:bg-white/10"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Card
              </button>
            </>
          )}

          <button
            onClick={() => exportDeck('csv')}
            className="py-2 px-3 bg-white/5 border border-white/5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 hover:bg-white/10"
          >
            <Download className="w-3.5 h-3.5" /> Export .csv
          </button>
        </div>
      </div>

      {/* manual card adding form */}
      {showAddForm && (
        <form onSubmit={handleManualAdd} className="p-5 bg-white/5 border border-white/5 rounded-xl space-y-4 max-w-xl">
          <h3 className="text-sm font-semibold text-white">Create Custom Flashcard</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-apple-gray uppercase font-semibold mb-1">Front Prompt</label>
              <input
                type="text"
                value={newFront}
                onChange={(e) => setNewFront(e.target.value)}
                placeholder="Question or key term"
                className="w-full bg-apple-black/40 border border-white/5 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-apple-blue"
              />
            </div>
            <div>
              <label className="block text-[10px] text-apple-gray uppercase font-semibold mb-1">Back Definition</label>
              <input
                type="text"
                value={newBack}
                onChange={(e) => setNewBack(e.target.value)}
                placeholder="Definition or answer"
                className="w-full bg-apple-black/40 border border-white/5 rounded px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-apple-blue"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 bg-white/5 rounded text-xs text-apple-gray"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-apple-blue rounded text-xs text-white font-semibold"
            >
              Add Card
            </button>
          </div>
        </form>
      )}

      {/* Main Review Zone */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Statistics and Progress */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
            <h4 className="text-xs font-semibold text-apple-gray uppercase tracking-wider mb-4">Review Metrics</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-apple-gray">Remaining Today</span>
                <span className="text-sm font-semibold text-white">{dueCards.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-apple-gray">Reviewed Today</span>
                <span className="text-sm font-semibold text-white">{reviewedTodayCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-apple-gray">Total Cards Loaded</span>
                <span className="text-sm font-semibold text-white">
                  {flashcards.filter(c => selectedDocId === 'all' || c.documentId === selectedDocId).length}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-950/20 border border-purple-500/10 rounded-2xl text-[11px] leading-relaxed text-purple-300">
            💡 **Spaced Repetition Tip**: Answer honestly. Lower ratings schedule reviews closer, while high ratings delay card views to optimal retention points.
          </div>
        </div>

        {/* The Flashcard itself */}
        <div className="md:col-span-3">
          {activeCard ? (
            <div className="space-y-6">
              {/* Card Shell */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="h-80 w-full cursor-pointer relative perspective-1000 group"
              >
                <motion.div
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  className="w-full h-full duration-500 transform-style-3d relative"
                >
                  {/* Front Side */}
                  <div className="absolute inset-0 bg-gradient-to-br from-apple-dark to-black border border-white/10 rounded-2xl p-8 flex flex-col justify-between backface-hidden">
                    <span className="text-[10px] text-apple-gray uppercase tracking-wider font-semibold">Question</span>
                    <div className="text-center my-auto px-4">
                      <p className="text-lg font-medium text-white leading-relaxed">{activeCard.front}</p>
                    </div>
                    <span className="text-[10px] text-apple-blue font-medium text-center hover:underline">Click to reveal answer</span>
                  </div>

                  {/* Back Side */}
                  <div
                    style={{ transform: 'rotateY(180deg)' }}
                    className="absolute inset-0 bg-gradient-to-br from-purple-950/20 to-black border border-purple-500/20 rounded-2xl p-8 flex flex-col justify-between backface-hidden"
                  >
                    <span className="text-[10px] text-purple-400 uppercase tracking-wider font-semibold">Answer / Explanation</span>
                    <div className="text-center my-auto px-4">
                      <p className="text-lg font-medium text-white leading-relaxed">{activeCard.back}</p>
                    </div>
                    <span className="text-[10px] text-apple-gray font-medium text-center">Click to flip front</span>
                  </div>
                </motion.div>
              </div>

              {/* SM-2 Feedback Controllers */}
              <AnimatePresence>
                {isFlipped && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none"
                  >
                    <button
                      onClick={() => handleSM2Review('again')}
                      className="p-3 bg-red-950/30 hover:bg-red-900/40 border border-red-500/20 rounded-xl text-left apple-transition flex flex-col"
                    >
                      <span className="text-xs font-bold text-red-400">Again</span>
                      <span className="text-[10px] text-red-300/80 mt-1">Review immediately (1d)</span>
                    </button>
                    <button
                      onClick={() => handleSM2Review('hard')}
                      className="p-3 bg-yellow-950/30 hover:bg-yellow-900/40 border border-yellow-500/20 rounded-xl text-left apple-transition flex flex-col"
                    >
                      <span className="text-xs font-bold text-yellow-400">Hard</span>
                      <span className="text-[10px] text-yellow-300/80 mt-1">Review soon (3d)</span>
                    </button>
                    <button
                      onClick={() => handleSM2Review('good')}
                      className="p-3 bg-blue-950/30 hover:bg-blue-900/40 border border-blue-500/20 rounded-xl text-left apple-transition flex flex-col"
                    >
                      <span className="text-xs font-bold text-blue-400">Good</span>
                      <span className="text-[10px] text-blue-300/80 mt-1">Normal intervals</span>
                    </button>
                    <button
                      onClick={() => handleSM2Review('easy')}
                      className="p-3 bg-green-950/30 hover:bg-green-900/40 border border-green-500/20 rounded-xl text-left apple-transition flex flex-col"
                    >
                      <span className="text-xs font-bold text-green-400">Easy</span>
                      <span className="text-[10px] text-green-300/80 mt-1">Push way out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="h-80 border border-dashed border-white/5 rounded-2xl bg-white/[0.01] flex flex-col items-center justify-center text-center p-8 select-none">
              <CheckCircle2 className="w-12 h-12 text-apple-blue mb-4" />
              <h3 className="text-base font-semibold text-white">Review Finished!</h3>
              <p className="text-xs text-apple-gray max-w-xs mt-1">
                You have completed all scheduled cards for this subject folder.
              </p>
              {selectedDocId !== 'all' && (
                <button
                  onClick={triggerGenerate}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-apple-blue to-purple-600 hover:from-apple-blue/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Auto-Generate Cards
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
