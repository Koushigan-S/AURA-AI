import React, { useState } from 'react';
import type { AuraDocument, Settings } from '../types';
import { autoEnrichNotes } from '../services/gemini';
import { PenTool, AlertCircle, CheckCircle2 } from 'lucide-react';

interface NotesManagerProps {
  documents: AuraDocument[];
  setDocuments: (docs: AuraDocument[]) => void;
  settings: Settings;
}

export const NotesManager: React.FC<NotesManagerProps> = ({
  documents,
  setDocuments,
  settings,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>('all');
  const [newContent, setNewContent] = useState('');
  const [autoEnrich, setAutoEnrich] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activeDoc = documents.find(d => d.id === selectedDocId) || null;

  const handleMergeNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoc || !newContent.trim()) return;

    setLoading(true);
    setStatusMessage(null);

    try {
      // Call Gemini or fallback mock notes integration
      const mergedSummary = await autoEnrichNotes(activeDoc.summary, newContent, settings);
      
      // Update state and persistence
      const updated = documents.map((doc) => {
        if (doc.id === activeDoc.id) {
          return {
            ...doc,
            summary: mergedSummary
          };
        }
        return doc;
      });

      setDocuments(updated);
      setNewContent('');
      setStatusMessage('Notes merged and successfully enriched! Visit the Study Room to see the updated summaries.');
    } catch (error) {
      console.error(error);
      setStatusMessage('Failed to integrate notes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full p-8 overflow-y-auto space-y-8 select-none">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Expand Syllabus Content</h2>
        <p className="text-apple-gray text-sm mt-1">Paste additional study notes and merge them into the master summary.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Editor Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleMergeNotes} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-apple-gray uppercase mb-2">Target Study Guide</label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full bg-apple-black/40 border border-white/10 rounded-lg text-xs font-semibold px-3 py-2.5 text-white outline-none cursor-pointer"
                >
                  <option value="all" disabled>Select document...</option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-apple-gray uppercase mb-2">Paste Additional Notes</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Paste lecture logs, textbook notes, or scrap text here..."
                  rows={8}
                  className="w-full bg-apple-black/40 border border-white/10 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-apple-blue focus:border-apple-blue placeholder:text-apple-gray/30 leading-relaxed font-sans"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="block text-xs font-medium text-white/95">Auto-Enrich Content</span>
                  <span className="block text-[10px] text-apple-gray mt-0.5">Let AURA research and append analogies, real-world examples, and references.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoEnrich(!autoEnrich)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full apple-transition ${
                    autoEnrich ? 'bg-apple-blue' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white apple-transition ${
                      autoEnrich ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || selectedDocId === 'all' || !newContent.trim()}
              className="w-full py-2.5 bg-apple-blue hover:bg-apple-blue/90 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-40"
            >
              <PenTool className="w-3.5 h-3.5" />
              {loading ? 'Synthesizing knowledge fields...' : 'Enrich & Merge Notes'}
            </button>
          </form>
        </div>

        {/* Right Info Box / Result Feedback */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-apple-gray uppercase tracking-wider">Merge Inspector</h3>

          {statusMessage && (
            <div className="p-5 bg-green-950/20 border border-green-500/20 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-green-200">Knowledge Synced</h4>
                <p className="text-[11px] text-green-300/80 mt-1 leading-relaxed">{statusMessage}</p>
              </div>
            </div>
          )}

          {activeDoc ? (
            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
              <span className="text-[9px] uppercase font-bold text-apple-blue tracking-wider">Previewing Active Summary</span>
              <h4 className="text-xs font-semibold text-white truncate">{activeDoc.name}</h4>
              <div className="text-[10px] text-apple-gray leading-relaxed max-h-40 overflow-y-auto border-t border-white/5 pt-2 whitespace-pre-wrap font-sans">
                {activeDoc.summary}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
              <AlertCircle className="w-8 h-8 text-apple-gray/25 mx-auto mb-2" />
              <p className="text-xs text-apple-gray">Select an active document syllabus path to preview and inspect notes merging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
