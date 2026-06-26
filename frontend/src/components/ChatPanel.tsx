import React, { useRef, useEffect, useState } from 'react';
import type { AuraDocument, Settings } from '../types';
import { answerChatQuestion } from '../services/gemini';
import { Send, Bot, User, Sparkles, X } from 'lucide-react';

interface ChatPanelProps {
  document: AuraDocument | null;
  settings: Settings;
  onClose?: () => void;
}

interface Message {
  role: 'user' | 'model';
  parts: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ document, settings, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      parts: document
        ? `Hello! I am AURA. I\'ve analyzed **${document.name}** under **${settings.topicMode} Mode**. Ask me anything about it!`
        : "Hello! Upload a document or pick a demo sample, and we can discuss the concepts here. Ask me anything!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    // Reset conversation when document changes
    setMessages([
      {
        role: 'model',
        parts: document
          ? `Hello! I am AURA. I\'ve analyzed **${document.name}** under **${settings.topicMode} Mode**. Ask me anything about it!`
          : "Hello! Upload a document or pick a demo sample, and we can discuss the concepts here. Ask me anything!"
      }
    ]);
  }, [document, settings.topicMode]);

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput('');
    const userMsg: Message = { role: 'user', parts: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const chatHistory = messages.slice(1).map(m => ({ role: m.role, parts: m.parts }));
      const response = await answerChatQuestion(text, chatHistory, document, settings);
      setMessages((prev) => [...prev, { role: 'model', parts: response }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'model', parts: 'An error occurred. Please check your API key.' }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = document
    ? [
        { label: 'Summarize Chapter', query: 'Summarize this chapter in one paragraph.' },
        { label: 'Explain with Analogy', query: 'Explain the core concept here using a simple analogy.' },
        { label: 'Key Formulas', query: 'List all key formulas or definitions found in this text.' }
      ]
    : [
        { label: 'What can AURA do?', query: 'Explain how AURA\'s adaptive testing and flashcards work.' },
        { label: 'Show study modes', query: 'Describe the differences between Exam, Story, and Concept Mode.' }
      ];

  return (
    <div className="flex flex-col h-full bg-apple-dark border-l border-white/5 select-none w-full max-w-sm">
      {/* Panel Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-apple-blue" />
          <div>
            <h3 className="text-sm font-semibold text-white">AURA Companion</h3>
            <p className="text-[10px] text-apple-gray font-medium">Context-Aware AI Chat</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 text-apple-gray hover:text-white apple-transition cursor-pointer"
            title="Close AI Chat"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 max-w-[85%] ${
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                msg.role === 'user' ? 'bg-apple-blue/10 border-apple-blue/20' : 'bg-white/5 border-white/10'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-3.5 h-3.5 text-apple-blue" />
              ) : (
                <Bot className="w-3.5 h-3.5 text-purple-400" />
              )}
            </div>
            <div
              className={`p-3 rounded-2xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-apple-blue text-white rounded-tr-none'
                  : 'bg-white/5 text-white/90 border border-white/5 rounded-tl-none font-sans whitespace-pre-line'
              }`}
            >
              {msg.parts}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-[85%] mr-auto items-center">
            <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            </div>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-apple-gray rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-apple-gray rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-apple-gray rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 border-t border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar">
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p.query)}
            className="shrink-0 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-white/80 border border-white/5 apple-transition font-medium flex items-center gap-1"
          >
            <Sparkles className="w-2.5 h-2.5 text-purple-400" />
            {p.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AURA..."
            className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-3 pr-10 text-xs text-white focus:outline-none focus:ring-1 focus:ring-apple-blue focus:border-apple-blue placeholder:text-apple-gray/50"
          />
          <button
            type="submit"
            className="absolute right-2 p-1.5 rounded-lg bg-apple-blue hover:bg-apple-blue/90 text-white apple-transition"
          >
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>
    </div>
  );
};
