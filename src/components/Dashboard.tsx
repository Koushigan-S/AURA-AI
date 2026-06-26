import React, { useRef, useState } from 'react';
import type { AuraDocument, Settings } from '../types';
import { UploadCloud, File, Trash2, ArrowRight, BookOpen, Clock, Award, ShieldAlert, Sparkles } from 'lucide-react';
import { processFile, getFileFingerprint } from '../services/docParser';
import { detectTopic, summarizeContent } from '../services/gemini';

interface DashboardProps {
  documents: AuraDocument[];
  setDocuments: (docs: AuraDocument[]) => void;
  selectedDoc: AuraDocument | null;
  setSelectedDoc: (doc: AuraDocument | null) => void;
  setActiveView: (view: string) => void;
  settings: Settings;
  flashcardCount: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  documents,
  setDocuments,
  selectedDoc,
  setSelectedDoc,
  setActiveView,
  settings,
  flashcardCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    setLoading(true);

    try {
      const fingerprint = getFileFingerprint(file);
      const isDuplicate = documents.some((doc) => doc.id === fingerprint);
      
      if (isDuplicate) {
        throw new Error(`The document "${file.name}" has already been uploaded.`);
      }

      // Parse the file (TXT, DOCX, or PDF)
      const baseDoc = await processFile(file);
      
      // Perform AI Topic Detection & Summarization
      const topicContext = await detectTopic(baseDoc.content, settings);
      const summary = await summarizeContent(baseDoc.name, baseDoc.content, settings);

      const completeDoc: AuraDocument = {
        ...baseDoc,
        topicContext,
        summary,
      };

      const updatedDocs = [...documents, completeDoc];
      setDocuments(updatedDocs);
      setSelectedDoc(completeDoc);
      setActiveView('reader');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during file upload.');
    } finally {
      setLoading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const loadSampleDocument = async (sampleType: 'physics' | 'history' | 'literature') => {
    setError(null);
    setLoading(true);

    try {
      let docName = '';
      let fileContent = '';
      let topic = '';

      if (sampleType === 'physics') {
        docName = 'Quantum Mechanics Chapter 1.pdf';
        fileContent = `De Broglie wavelength relates wave properties to particle properties: lambda = h / p. Wave-particle duality suggests that matter exhibits both wave-like characteristics and particle-like characteristics depending on the environment. Superposition describes systems existing in multiple states simultaneously. Measuring states collapses their wave functions.`;
        topic = 'Quantum Physics (Concept Mode)';
      } else if (sampleType === 'history') {
        docName = 'French Revolution Summary.txt';
        fileContent = `On May 5, 1789, the Estates-General assembled at Versailles. The Third Estate represented 98% of the population. Disputes over voting structure triggered reform. On July 14, 1789, citizens stormed the Bastille prison for weapons, destroying absolute royal authority.`;
        topic = 'The French Revolution (Exam Mode)';
      } else {
        docName = 'The Great Gatsby Chapter 1.docx';
        fileContent = `Nick Carraway moves to West Egg next to Gatsby. Gatsby stares at the green light across the bay. Daisy Buchanan lives in East Egg. The narrative explores the corruption of dreams. No spoilers are included in this study context.`;
        topic = 'The Great Gatsby (Story Mode)';
      }

      // Generate a mock fingerprint
      const mockId = `sample-${sampleType}`;
      if (documents.some(doc => doc.id === mockId)) {
        throw new Error(`The sample document "${docName}" is already loaded.`);
      }

      const summary = await summarizeContent(docName, fileContent, settings);

      const sampleDoc: AuraDocument = {
        id: mockId,
        name: docName,
        size: fileContent.length * 2, // approximation
        type: sampleType === 'history' ? 'txt' : (sampleType === 'physics' ? 'pdf' : 'docx'),
        content: fileContent,
        pages: [fileContent.substring(0, Math.floor(fileContent.length / 2)), fileContent.substring(Math.floor(fileContent.length / 2))],
        sections: [
          { id: 'mock-sec-1', title: 'Part A', content: fileContent.substring(0, Math.floor(fileContent.length / 2)), summary: 'Summary of Part A' },
          { id: 'mock-sec-2', title: 'Part B', content: fileContent.substring(Math.floor(fileContent.length / 2)), summary: 'Summary of Part B' }
        ],
        highlights: [],
        topicContext: topic,
        summary,
        uploadedAt: new Date().toISOString()
      };

      const updatedDocs = [...documents, sampleDoc];
      setDocuments(updatedDocs);
      setSelectedDoc(sampleDoc);
      setActiveView('reader');
    } catch (err: any) {
      setError(err.message || 'Failed to load sample document.');
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = documents.filter((doc) => doc.id !== id);
    setDocuments(updated);
    if (selectedDoc?.id === id) {
      setSelectedDoc(updated.length > 0 ? updated[0] : null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full h-full p-8 overflow-y-auto space-y-8 select-none">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Study Center</h2>
          <p className="text-apple-gray text-sm mt-1">Study Smarter, Not Harder — with AURA.</p>
        </div>
        
        {/* Status Metrics */}
        <div className="flex gap-4">
          <div className="px-4 py-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
            <Clock className="w-5 h-5 text-apple-blue" />
            <div>
              <span className="block text-xs text-apple-gray font-medium">Session Time</span>
              <span className="block text-sm font-semibold text-white">45m today</span>
            </div>
          </div>
          <div className="px-4 py-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
            <Award className="w-5 h-5 text-purple-400" />
            <div>
              <span className="block text-xs text-apple-gray font-medium">Study Deck</span>
              <span className="block text-sm font-semibold text-white">{flashcardCount} Cards</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-red-200">Upload Restrained</h4>
            <p className="text-xs text-red-300/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {!settings.geminiApiKey && (
        <div className="p-5 bg-gradient-to-r from-purple-950/20 via-white/[0.01] to-transparent border border-purple-500/10 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              API Key Strategy & Offline Demo Mode
            </h4>
            <p className="text-xs text-white/95 leading-relaxed">
              <strong>API Key Strategy & Storage:</strong> To power the AI features, you can paste your Gemini API Key in the Settings Panel. The key is stored securely in your browser's local storage and is never sent to any third-party backend.
            </p>
            <p className="text-xs text-apple-gray leading-relaxed">
              <strong>Offline Demo Mode:</strong> If no API Key is provided, the app runs in Offline Demo Mode with pre-configured mock data (e.g., a Physics chapter, history text, and literature short story) and simulated AI behaviors so you can try all features instantly!
            </p>
          </div>
          <button
            onClick={() => setActiveView('settings')}
            className="py-1.5 px-3.5 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-xs font-semibold rounded-lg text-purple-300 apple-transition shrink-0 cursor-pointer"
          >
            Configure Settings
          </button>
        </div>
      )}

      {/* Upload Zone & Samples */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* File Dropzone */}
        <div className="lg:col-span-2">
          <div
            onDragOver={onDragOver}
            onDrop={onDrop}
            onClick={triggerFileInput}
            className="h-64 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] flex flex-col items-center justify-center cursor-pointer apple-transition p-6 text-center group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.txt"
              className="hidden"
            />
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-apple-blue border-t-transparent animate-spin" />
                <p className="text-sm text-apple-gray">AURA is scanning content and building summaries...</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-105 apple-transition">
                  <UploadCloud className="w-6 h-6 text-apple-blue" />
                </div>
                <h3 className="text-base font-semibold text-white mb-1">Upload Study Material</h3>
                <p className="text-xs text-apple-gray max-w-xs leading-relaxed mb-1">
                  Drag and drop your PDF, DOCX, or TXT file here or click to browse.
                </p>
                <p className="text-[10px] text-apple-gray/40">Duplicate file uploads are automatically filtered.</p>
              </>
            )}
          </div>
        </div>

        {/* Load Offline Demo Samples */}
        <div className="apple-glass rounded-2xl border border-white/5 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Quick Sandbox Demos
            </h3>
            <p className="text-xs text-apple-gray mb-4 leading-relaxed">
              No Gemini API key yet? Explore AURA immediately using pre-crafted curriculum templates.
            </p>
            <div className="space-y-2.5">
              <button
                onClick={() => loadSampleDocument('physics')}
                className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs border border-white/5 apple-transition font-medium flex justify-between items-center"
              >
                <span>Quantum Physics (Concept Mode)</span>
                <ArrowRight className="w-3.5 h-3.5 text-apple-blue" />
              </button>
              <button
                onClick={() => loadSampleDocument('history')}
                className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs border border-white/5 apple-transition font-medium flex justify-between items-center"
              >
                <span>The French Revolution (Exam Mode)</span>
                <ArrowRight className="w-3.5 h-3.5 text-apple-blue" />
              </button>
              <button
                onClick={() => loadSampleDocument('literature')}
                className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs border border-white/5 apple-transition font-medium flex justify-between items-center"
              >
                <span>The Great Gatsby (Story Mode)</span>
                <ArrowRight className="w-3.5 h-3.5 text-apple-blue" />
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Uploaded Documents List */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Your Curriculum library</h3>
        {documents.length === 0 ? (
          <div className="text-center py-12 border border-white/5 rounded-2xl bg-white/[0.01]">
            <File className="w-10 h-10 text-apple-gray/20 mx-auto mb-3" />
            <p className="text-sm text-apple-gray">No documents loaded yet. Upload a file above or click a demo sandbox template.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    setSelectedDoc(doc);
                    setActiveView('reader');
                  }}
                  className={`p-5 rounded-2xl border apple-transition cursor-pointer flex flex-col justify-between h-44 relative group ${
                    isSelected
                      ? 'border-apple-blue bg-apple-blue/5'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                        <File className="w-5 h-5 text-apple-blue" />
                      </div>
                      <button
                        onClick={(e) => deleteDocument(doc.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-apple-gray hover:text-white apple-transition absolute top-4 right-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="text-sm font-semibold text-white/95 truncate mt-4 pr-6">{doc.name}</h4>
                    <p className="text-[11px] text-purple-400 font-medium mt-1">{doc.topicContext}</p>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-apple-gray mt-2 pt-2 border-t border-white/5">
                    <span>{formatSize(doc.size)}</span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-apple-blue" />
                      {doc.pages.length} section{doc.pages.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
