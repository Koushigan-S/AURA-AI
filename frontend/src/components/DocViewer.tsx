import React, { useState, useEffect, useRef } from 'react';
import type { AuraDocument, AuraHighlight, Settings } from '../types';
import { generateAutoHighlights, summarizeContent } from '../services/gemini';
import { BookOpen, Highlighter, Volume2, Plus, Download, Sparkles, Check, Bookmark, Eye, EyeOff, PanelLeft, PanelRight, MessageSquare } from 'lucide-react';

interface DocViewerProps {
  document: AuraDocument | null;
  setDocuments: (docs: AuraDocument[]) => void;
  documents: AuraDocument[];
  settings: Settings;
  setSettings: (s: Settings) => void;
  isIndexCollapsed: boolean;
  setIsIndexCollapsed: (c: boolean) => void;
  isSummaryCollapsed: boolean;
  setIsSummaryCollapsed: (c: boolean) => void;
  isChatCollapsed: boolean;
  setIsChatCollapsed: (c: boolean) => void;
}

export const DocViewer: React.FC<DocViewerProps> = ({
  document,
  setDocuments,
  documents,
  settings,
  setSettings,
  isIndexCollapsed,
  setIsIndexCollapsed,
  isSummaryCollapsed,
  setIsSummaryCollapsed,
  isChatCollapsed,
  setIsChatCollapsed,
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string>('');
  const [showAiHighlights, setShowAiHighlights] = useState<boolean>(true);
  const [selectionRange, setSelectionRange] = useState<{ text: string; x: number; y: number } | null>(null);
  const [highlightNote, setHighlightNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [selectedHighlightType, setSelectedHighlightType] = useState<'fact' | 'definition' | 'formula' | 'insight'>('fact');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingText, setSpeakingText] = useState('');
  const textContainerRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Initialize first section
  useEffect(() => {
    if (document && document.sections.length > 0) {
      setActiveSectionId(document.sections[0].id);
    }
  }, [document]);

  // Load section summary on section change if it doesn't exist
  useEffect(() => {
    if (!document || !activeSectionId) return;
    const currentSection = document.sections.find((s) => s.id === activeSectionId);
    if (!currentSection || currentSection.summary) return;

    const fetchSectionSummary = async () => {
      try {
        const generated = await summarizeContent(
          `${document.name} - ${currentSection.title}`,
          currentSection.content,
          settings
        );

        const updatedDocs = documents.map((doc) => {
          if (doc.id === document.id) {
            const updatedSections = doc.sections.map((s) => {
              if (s.id === currentSection.id) {
                return { ...s, summary: generated };
              }
              return s;
            });
            return { ...doc, sections: updatedSections };
          }
          return doc;
        });

        setDocuments(updatedDocs);
      } catch (err) {
        console.error('Error generating section summary:', err);
      }
    };

    fetchSectionSummary();
  }, [activeSectionId, document?.id, documents, setDocuments, settings]);


  if (!document) {
    return (
      <div className="flex-1 flex overflow-hidden h-full apple-transition">
        {/* Left Sidebar - Section Index placeholder */}
        {!isIndexCollapsed && (
          <div className="bg-apple-dark border-r border-white/5 w-56 shrink-0 select-none p-4 flex flex-col justify-between apple-transition">
            <div>
              <h3 className="text-xs font-semibold text-apple-gray uppercase tracking-wider">Revision Index</h3>
              <p className="text-[10px] text-apple-gray/40 italic mt-4 text-center">No document loaded</p>
            </div>
          </div>
        )}

        {/* Center Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-8 pb-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-4 max-w-2xl mx-auto w-full">
              <div>
                <span className="text-[10px] text-apple-blue font-semibold uppercase tracking-wider">AURA STUDY ROOM</span>
                <h2 className="text-xl font-semibold text-white tracking-tight mt-0.5">Study Room</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsIndexCollapsed(!isIndexCollapsed)}
                  className={`p-1.5 rounded-lg border apple-transition cursor-pointer ${
                    isIndexCollapsed ? 'bg-white/5 border-white/5 text-apple-gray' : 'bg-apple-blue/10 border-apple-blue/20 text-apple-blue'
                  }`}
                  title={isIndexCollapsed ? 'Show Study Index' : 'Hide Study Index'}
                >
                  <PanelLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsSummaryCollapsed(!isSummaryCollapsed)}
                  className={`p-1.5 rounded-lg border apple-transition cursor-pointer ${
                    isSummaryCollapsed ? 'bg-white/5 border-white/5 text-apple-gray' : 'bg-apple-blue/10 border-apple-blue/20 text-apple-blue'
                  }`}
                  title={isSummaryCollapsed ? 'Show Notes Sidebar' : 'Hide Notes Sidebar'}
                >
                  <PanelRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsChatCollapsed(!isChatCollapsed)}
                  className={`p-1.5 rounded-lg border apple-transition cursor-pointer ${
                    isChatCollapsed ? 'bg-white/5 border-white/5 text-apple-gray' : 'bg-apple-blue/10 border-apple-blue/20 text-apple-blue'
                  }`}
                  title={isChatCollapsed ? 'Show Companion Chat' : 'Hide Companion Chat'}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
            <BookOpen className="w-16 h-16 text-apple-gray/20 mb-4" />
            <h3 className="text-lg font-semibold text-white">No Active Study Room</h3>
            <p className="text-sm text-apple-gray max-w-sm mt-1">Upload a document or load a demo sandbox from the Dashboard to start learning.</p>
          </div>
        </div>

        {/* Right Sidebar - Summaries placeholder */}
        {!isSummaryCollapsed && (
          <div className="bg-apple-dark border-l border-white/5 w-64 p-4 shrink-0 select-none flex flex-col gap-4 apple-transition">
            <div>
              <h3 className="text-xs font-semibold text-apple-gray uppercase tracking-wider">Section Summary</h3>
              <p className="text-[10px] text-apple-gray/40 italic mt-4 text-center">No document loaded</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  const activeSection = document.sections.find((s) => s.id === activeSectionId) || document.sections[0];

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const text = selection.toString();
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      
      // Calculate coordinates relative to viewport (since popup is fixed)
      setSelectionRange({
        text,
        x: rect.left + (rect.width / 2) - 140, // Centered horizontally
        y: rect.top - 55 // Placed 55px above selection
      });
      setShowNoteInput(false);
    } else {
      setSelectionRange(null);
    }
  };


  const addHighlight = (
    text: string,
    type: 'fact' | 'definition' | 'formula' | 'insight',
    color: 'yellow' | 'blue' | 'green' | 'purple',
    note?: string
  ) => {
    const newHighlight: AuraHighlight = {
      id: `hl-${Date.now()}`,
      text,
      color,
      type,
      note,
      isAI: false,
      pageIndex: document.sections.indexOf(activeSection),
      createdAt: new Date().toISOString()
    };

    // Update highlights list in active document
    const updatedDocs = documents.map((doc) => {
      if (doc.id === document.id) {
        return {
          ...doc,
          highlights: [...doc.highlights, newHighlight]
        };
      }
      return doc;
    });

    // Simple learning preference logic: update active preferred color
    if (settings.learnHighlightColors) {
      const updatedColors = { ...settings.preferredColors, [type]: color };
      setSettings({ ...settings, preferredColors: updatedColors });
    }

    setDocuments(updatedDocs);
    setSelectionRange(null);
    setHighlightNote('');
    setShowNoteInput(false);
  };

  const triggerAutoHighlight = async () => {
    if (!document) return;
    try {
      const generated = await generateAutoHighlights(activeSection.content, settings);
      
      const newHighlights: AuraHighlight[] = generated.map((gh, idx) => ({
        id: `hl-ai-${Date.now()}-${idx}`,
        text: gh.text,
        color: gh.color,
        type: gh.type,
        isAI: true,
        pageIndex: document.sections.indexOf(activeSection),
        createdAt: new Date().toISOString()
      }));

      // Filter out existing duplicates
      const currentHls = document.highlights;
      const filteredNew = newHighlights.filter(nh => !currentHls.some(ch => ch.text.toLowerCase() === nh.text.toLowerCase()));

      const updatedDocs = documents.map((doc) => {
        if (doc.id === document.id) {
          return {
            ...doc,
            highlights: [...doc.highlights, ...filteredNew]
          };
        }
        return doc;
      });

      setDocuments(updatedDocs);
    } catch (error) {
      console.error('Failed to auto-highlight:', error);
    }
  };

  // Text reader highlighter helper
  const renderHighlightedContent = (text: string) => {
    // Collect active page highlights
    const activePageIndex = document.sections.indexOf(activeSection);
    const pageHighlights = document.highlights.filter(
      (h) => h.pageIndex === activePageIndex && (showAiHighlights || !h.isAI)
    );

    if (pageHighlights.length === 0) return <p className="leading-relaxed text-sm whitespace-pre-wrap">{text}</p>;

    // We build a regex that matches any of the highlight substrings
    // Escape special characters for regex
    const sortedHls = [...pageHighlights].sort((a, b) => b.text.length - a.text.length);
    const regexParts = sortedHls.map((h) => h.text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    const regex = new RegExp(`(${regexParts.join('|')})`, 'gi');

    const parts = text.split(regex);
    return (
      <p className="leading-relaxed text-sm whitespace-pre-wrap">
        {parts.map((part, index) => {
          const matchingHl = pageHighlights.find(
            (h) => h.text.toLowerCase() === part.toLowerCase()
          );
          if (matchingHl) {
            let className = 'highlight-fact';
            if (matchingHl.color === 'blue') className = 'highlight-definition';
            if (matchingHl.color === 'green') className = 'highlight-formula';
            if (matchingHl.color === 'purple') className = 'highlight-insight';

            return (
              <span
                key={index}
                className={`${className} relative group cursor-pointer`}
                onClick={() => speakText(matchingHl.text)}
                title={matchingHl.note ? `Note: ${matchingHl.note}` : 'Click to hear text'}
              >
                {part}
                {matchingHl.note && (
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-apple-dark text-[10px] text-white rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {matchingHl.note}
                  </span>
                )}
              </span>
            );
          }
          return part;
        })}
      </p>
    );
  };

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    if (isSpeaking && speakingText === text) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      return;
    }
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.speechRate || 1.0;
    utterance.onend = () => setIsSpeaking(false);
    setSpeakingText(text);
    setIsSpeaking(true);
    synthRef.current.speak(utterance);
  };

  const exportHtmlStudySheet = () => {
    const parseMarkdownToHtml = (md: string) => {
      if (!md) return '';
      // Escape HTML entities to prevent rendering issues with math tags or random < characters
      let escaped = md
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Format headers
      escaped = escaped
        .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
        .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
        .replace(/^# (.*?)$/gm, '<h1>$1</h1>');

      // Format bold and italic
      escaped = escaped
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>');

      // Format list items
      escaped = escaped
        .replace(/^\s*[-*]\s+(.*?)$/gm, '<li>$1</li>');

      // Group contiguous <li> elements inside <ul>
      const lines = escaped.split('\n');
      let inList = false;
      const formattedLines = [];

      for (let line of lines) {
        const isLi = line.trim().startsWith('<li>');
        if (isLi && !inList) {
          inList = true;
          formattedLines.push('<ul>');
        } else if (!isLi && inList) {
          inList = false;
          formattedLines.push('</ul>');
        }
        formattedLines.push(line);
      }
      if (inList) {
        formattedLines.push('</ul>');
      }

      // Join and do paragraph formatting for double line breaks
      return formattedLines
        .join('\n')
        .split(/\n\s*\n/)
        .map(p => {
          const trimmed = p.trim();
          if (!trimmed) return '';
          if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<ul>') || trimmed.startsWith('<li')) {
            return trimmed;
          }
          return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
        })
        .join('\n');
    };

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AURA Study Sheet - ${document.name}</title>
  <style>
    :root {
      --primary: #0071e3;
      --bg: #0d0d0d;
      --card-bg: #1a1a1a;
      --text: #f5f5f7;
      --text-gray: #86868b;
      --border: rgba(255,255,255,0.08);
      
      --yellow: rgba(250, 204, 21, 0.15);
      --yellow-border: rgba(250, 204, 21, 0.4);
      --yellow-text: #fde047;
      
      --blue: rgba(59, 130, 246, 0.15);
      --blue-border: rgba(59, 130, 246, 0.4);
      --blue-text: #93c5fd;
      
      --green: rgba(34, 197, 94, 0.15);
      --green-border: rgba(34, 197, 94, 0.4);
      --green-text: #86efac;
      
      --purple: rgba(168, 85, 247, 0.15);
      --purple-border: rgba(168, 85, 247, 0.4);
      --purple-text: #d8b4fe;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 40px 20px;
      max-width: 900px;
      margin: auto;
    }
    header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    h1 {
      font-size: 30px;
      font-weight: 700;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
      color: #fff;
    }
    .meta {
      font-size: 13px;
      color: var(--text-gray);
      display: flex;
      gap: 16px;
    }
    .badge {
      background: rgba(255,255,255,0.06);
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 500;
      color: #fff;
    }
    h2 {
      font-size: 20px;
      font-weight: 600;
      margin-top: 40px;
      margin-bottom: 16px;
      border-left: 3px solid var(--primary);
      padding-left: 12px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    .summary-text {
      font-size: 14px;
      color: rgba(255,255,255,0.9);
    }
    .summary-text p, .section-body p {
      margin: 0 0 12px 0;
    }
    .summary-text h3, .section-body h3 {
      font-size: 15px;
      font-weight: 600;
      margin: 16px 0 8px 0;
      color: #fff;
    }
    .summary-text ul, .section-body ul {
      margin: 0 0 12px 0;
      padding-left: 20px;
    }
    .summary-text li, .section-body li {
      margin-bottom: 4px;
    }
    ul.highlights-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    ul.highlights-list li {
      padding: 12px 16px;
      margin-bottom: 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      font-size: 13px;
    }
    .hl-fact {
      background: var(--yellow);
      border-color: var(--yellow-border) !important;
      color: var(--yellow-text);
    }
    .hl-definition {
      background: var(--blue);
      border-color: var(--blue-border) !important;
      color: var(--blue-text);
    }
    .hl-formula {
      background: var(--green);
      border-color: var(--green-border) !important;
      color: var(--green-text);
    }
    .hl-insight {
      background: var(--purple);
      border-color: var(--purple-border) !important;
      color: var(--purple-text);
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 12px 0;
      color: #fff;
    }
    .section-body {
      font-size: 13.5px;
      color: rgba(255,255,255,0.8);
    }
  </style>
</head>
<body>
  <header>
    <h1>AURA Study Sheet: ${document.name}</h1>
    <div class="meta">
      <span>Topic Mode: <span class="badge">${settings.topicMode.toUpperCase()}</span></span>
      <span>Topic Context: <span class="badge">${document.topicContext}</span></span>
    </div>
  </header>
  
  <h2>Document Executive Summary</h2>
  <div class="card">
    <div class="summary-text">${parseMarkdownToHtml(document.summary)}</div>
  </div>

  <h2>Annotated Study Highlights</h2>
  <div class="card">
    <ul class="highlights-list">
      ${document.highlights.length > 0 ? document.highlights.map(h => {
        let typeClass = 'hl-fact';
        if (h.color === 'blue') typeClass = 'hl-definition';
        if (h.color === 'green') typeClass = 'hl-formula';
        if (h.color === 'purple') typeClass = 'hl-insight';
        return `<li class="${typeClass}">
          <strong>[${h.type.toUpperCase()}]</strong> "${h.text}"
          ${h.note ? `<div style="margin-top: 6px; font-style: italic; opacity: 0.8;">Note: ${parseMarkdownToHtml(h.note)}</div>` : ''}
        </li>`;
      }).join('') : '<li style="color: var(--text-gray)">No highlights added yet.</li>'}
    </ul>
  </div>

  <h2>Revision Study Sections</h2>
  ${document.sections.map(s => `
    <div class="card">
      <div class="section-title">${s.title}</div>
      <div class="section-body">${parseMarkdownToHtml(s.content)}</div>
    </div>
  `).join('')}
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.name.split('.')[0]}_revision_sheet.html`;
    a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div className="flex-1 flex overflow-hidden h-full apple-transition">
      {/* Left Sidebar - Section Index */}
      <div className={`bg-apple-dark border-r border-white/5 overflow-y-auto flex flex-col justify-between shrink-0 select-none apple-transition ${
        isIndexCollapsed ? 'w-0 border-r-0 overflow-hidden' : 'w-56'
      }`}>
        <div className="p-4 space-y-4">
          <h3 className="text-xs font-semibold text-apple-gray uppercase tracking-wider">Revision Index</h3>
          <div className="space-y-1">
            {document.sections.map((s, index) => {
              const isActive = s.id === activeSectionId;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSectionId(s.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs leading-relaxed font-medium apple-transition ${
                    isActive
                      ? 'bg-white/5 text-white border-l-2 border-apple-blue'
                      : 'text-apple-gray hover:bg-white/[0.02] hover:text-white/80'
                  }`}
                >
                  <div className="truncate">{s.title}</div>
                  <div className="text-[10px] text-apple-gray/50 mt-0.5">Section {index + 1}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggle AI highlight & Export */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <button
            onClick={() => setShowAiHighlights(!showAiHighlights)}
            className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-medium border border-white/5 flex items-center justify-between apple-transition"
          >
            <span className="flex items-center gap-2">
              <Highlighter className="w-3.5 h-3.5 text-apple-blue" />
              AI Highlights
            </span>
            {showAiHighlights ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={exportHtmlStudySheet}
            className="w-full py-2 px-3 bg-apple-blue hover:bg-apple-blue/90 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 apple-transition"
          >
            <Download className="w-3.5 h-3.5" />
            HTML Study Sheet
          </button>
        </div>
      </div>

      {/* Center Panel - Main Reader & Selection Popup */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-8 overflow-y-auto flex flex-col justify-between" onMouseUp={handleTextSelection}>
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div>
                <span className="text-[10px] text-apple-blue font-semibold uppercase tracking-wider">{document.topicContext}</span>
                <h2 className="text-xl font-semibold text-white tracking-tight mt-0.5">{activeSection.title}</h2>
              </div>
              <div className="flex items-center gap-2">
                {/* Layout Toggles */}
                <button
                  onClick={() => setIsIndexCollapsed(!isIndexCollapsed)}
                  className={`p-1.5 rounded-lg border apple-transition ${
                    isIndexCollapsed ? 'bg-white/5 border-white/5 text-apple-gray' : 'bg-apple-blue/10 border-apple-blue/20 text-apple-blue'
                  }`}
                  title={isIndexCollapsed ? 'Show Study Index' : 'Hide Study Index'}
                >
                  <PanelLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsSummaryCollapsed(!isSummaryCollapsed)}
                  className={`p-1.5 rounded-lg border apple-transition ${
                    isSummaryCollapsed ? 'bg-white/5 border-white/5 text-apple-gray' : 'bg-apple-blue/10 border-apple-blue/20 text-apple-blue'
                  }`}
                  title={isSummaryCollapsed ? 'Show Notes Sidebar' : 'Hide Notes Sidebar'}
                >
                  <PanelRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsChatCollapsed(!isChatCollapsed)}
                  className={`p-1.5 rounded-lg border apple-transition ${
                    isChatCollapsed ? 'bg-white/5 border-white/5 text-apple-gray' : 'bg-apple-blue/10 border-apple-blue/20 text-apple-blue'
                  }`}
                  title={isChatCollapsed ? 'Show Companion Chat' : 'Hide Companion Chat'}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-[1px] bg-white/10 mx-1" />

                <button
                  onClick={() => speakText(activeSection.content)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-apple-gray hover:text-white border border-white/5 apple-transition"
                  title="Read whole section"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                {settings.enableAIHighlighting && (
                  <button
                    onClick={triggerAutoHighlight}
                    className="py-1.5 px-3 bg-gradient-to-r from-apple-blue to-purple-600 hover:from-apple-blue/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Auto-Highlight
                  </button>
                )}
              </div>
            </div>

            {/* Readout Window */}
            <div ref={textContainerRef} className="text-white/90 text-sm leading-relaxed tracking-wide select-text">
              {renderHighlightedContent(activeSection.content)}
            </div>
          </div>

          {/* Selection Hover Toolbar */}
          {selectionRange && (
            <div
              style={{ top: `${selectionRange.y}px`, left: `${selectionRange.x}px` }}
              onMouseUp={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="fixed z-50 bg-apple-dark border border-white/10 rounded-xl p-2.5 shadow-2xl flex flex-col gap-2 apple-glass select-none min-w-[280px]"
            >
              {!showNoteInput ? (

                <>
                  <div className="flex justify-between gap-1">
                    <button
                      onClick={() => addHighlight(selectionRange.text, 'fact', 'yellow')}
                      className="w-7 h-7 rounded-full bg-yellow-400 border border-yellow-500 hover:scale-105 transition-transform flex items-center justify-center text-black font-bold text-xs"
                      title="Fact (Yellow)"
                    >
                      F
                    </button>
                    <button
                      onClick={() => addHighlight(selectionRange.text, 'definition', 'blue')}
                      className="w-7 h-7 rounded-full bg-blue-500 border border-blue-600 hover:scale-105 transition-transform flex items-center justify-center text-white font-bold text-xs"
                      title="Definition (Blue)"
                    >
                      D
                    </button>
                    <button
                      onClick={() => addHighlight(selectionRange.text, 'formula', 'green')}
                      className="w-7 h-7 rounded-full bg-green-500 border border-green-600 hover:scale-105 transition-transform flex items-center justify-center text-white font-bold text-xs"
                      title="Formula (Green)"
                    >
                      X
                    </button>
                    <button
                      onClick={() => addHighlight(selectionRange.text, 'insight', 'purple')}
                      className="w-7 h-7 rounded-full bg-purple-500 border border-purple-600 hover:scale-105 transition-transform flex items-center justify-center text-white font-bold text-xs"
                      title="Insight (Purple)"
                    >
                      I
                    </button>
                    <button
                      onClick={() => setShowNoteInput(true)}
                      className="py-1 px-2 bg-white/5 hover:bg-white/10 rounded border border-white/5 text-[10px] text-white flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Note
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-apple-gray">
                    <span>Categorize & Add Note</span>
                    <div className="flex gap-1">
                      {(['fact', 'definition', 'formula', 'insight'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setSelectedHighlightType(t)}
                          className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold ${
                            selectedHighlightType === t ? 'bg-apple-blue text-white' : 'bg-white/5 text-apple-gray'
                          }`}
                        >
                          {t[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={highlightNote}
                    onChange={(e) => setHighlightNote(e.target.value)}
                    placeholder="Type study note..."
                    className="w-full bg-white/5 border border-white/5 rounded px-2 py-1 text-[11px] text-white focus:outline-none"
                    autoFocus
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => setShowNoteInput(false)}
                      className="px-2 py-1 bg-white/5 rounded text-[9px] text-apple-gray"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const colors: Record<string, 'yellow' | 'blue' | 'green' | 'purple'> = {
                          fact: 'yellow',
                          definition: 'blue',
                          formula: 'green',
                          insight: 'purple'
                        };
                        addHighlight(
                          selectionRange.text,
                          selectedHighlightType,
                          colors[selectedHighlightType],
                          highlightNote
                        );
                      }}
                      className="px-2.5 py-1 bg-apple-blue rounded text-[9px] text-white flex items-center gap-1 font-semibold"
                    >
                      <Check className="w-2.5 h-2.5" /> Save Highlight
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar - Margin Bullet summaries */}
        <div className={`bg-apple-dark border-l border-white/5 p-4 overflow-y-auto shrink-0 select-none flex flex-col gap-4 apple-transition ${
          isSummaryCollapsed ? 'w-0 p-0 border-l-0 overflow-hidden' : 'w-64'
        }`}>
          <div>
            <h3 className="text-xs font-semibold text-apple-gray uppercase tracking-wider flex items-center gap-1">
              <Bookmark className="w-3.5 h-3.5 text-purple-400" />
              Section Summary
            </h3>
            <div className="mt-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[11px] text-white/80 leading-relaxed font-sans prose prose-invert whitespace-pre-wrap">
              {activeSection.summary || 'Summary is building... Trigger AI Auto-Highlight or reload sample to fetch.'}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-apple-gray uppercase tracking-wider mb-3">Active Page Notes</h3>
            <div className="space-y-2">
              {document.highlights
                .filter(h => h.pageIndex === document.sections.indexOf(activeSection) && h.note)
                .map((h, idx) => (
                  <div key={idx} className="p-2 bg-white/5 border border-white/5 rounded-lg text-[10px] text-white/90">
                    <span className="font-semibold block text-apple-blue uppercase tracking-wider mb-0.5 text-[8px]">{h.type}</span>
                    <span className="italic">"{h.text.substring(0, 40)}..."</span>
                    <div className="mt-1 text-apple-gray font-medium">{h.note}</div>
                  </div>
                ))}
              {document.highlights.filter(h => h.pageIndex === document.sections.indexOf(activeSection) && h.note).length === 0 && (
                <p className="text-[10px] text-apple-gray/50 italic text-center py-4">No page annotations added. Select text to write notes.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
