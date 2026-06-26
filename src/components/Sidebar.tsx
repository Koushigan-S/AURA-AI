import React from 'react';
import { LayoutDashboard, FileText, BookOpen, Settings, Compass, PenTool, Sparkles, TrendingUp, PanelLeftClose, PanelLeft, LogOut } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  documentCount: number;
  reviewCount: number;
  isCollapsed: boolean;
  setIsCollapsed: (c: boolean) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  documentCount,
  reviewCount,
  isCollapsed,
  setIsCollapsed,
  onLogout,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: documentCount > 0 ? documentCount : undefined },
    { id: 'reader', label: 'Study Room', icon: FileText },
    { id: 'skills', label: 'Skill Status', icon: TrendingUp },
    { id: 'flashcards', label: 'Flashcard Deck', icon: Sparkles, badge: reviewCount > 0 ? reviewCount : undefined },
    { id: 'quizzes', label: 'Quiz Center', icon: BookOpen },
    { id: 'visualizer', label: 'Concept Mapping', icon: Compass },
    { id: 'notes', label: 'Auto-Enrich Notes', icon: PenTool },
  ];

  return (
    <aside className={`h-full bg-apple-dark border-r border-white/5 flex flex-col justify-between apple-transition select-none shrink-0 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div>
        {/* Brand Header */}
        <div className={`p-4 flex items-center justify-between border-b border-white/5 mb-4 ${
          isCollapsed ? 'flex-col gap-4' : 'flex-row'
        }`}>
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10 shadow-sm" 
              alt="AURA Logo" 
            />
            {!isCollapsed && (
              <div>
                <h1 className="text-base font-semibold text-white tracking-tight flex items-center gap-1.5">
                  AURA
                </h1>
                <p className="text-[10px] text-apple-gray font-medium tracking-wide uppercase">AI Assistant</p>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-apple-gray hover:text-white apple-transition"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="px-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center rounded-lg text-sm font-medium apple-transition group ${
                  isActive
                    ? 'bg-white/5 text-white border-l-2 border-apple-blue'
                    : 'text-apple-gray hover:bg-white/[0.02] hover:text-white/90'
                } ${isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'}`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 apple-transition shrink-0 ${
                    isActive ? 'text-apple-blue' : 'text-apple-gray group-hover:text-white/80'
                  }`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>
                {!isCollapsed && item.badge !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-apple-blue/20 text-apple-blue' : 'bg-white/5 text-apple-gray'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {isCollapsed && item.badge !== undefined && (
                  <span className="absolute w-2 h-2 rounded-full bg-apple-blue border border-apple-dark translate-x-2.5 -translate-y-2.5" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Settings & Logout */}
      <div className="p-2 border-t border-white/5 space-y-1">
        <button
          onClick={onLogout}
          className={`w-full flex items-center rounded-lg text-sm font-medium apple-transition text-red-400/90 hover:bg-red-500/10 hover:text-red-300 ${
            isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
          }`}
          title={isCollapsed ? 'Log Out' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Log Out</span>}
        </button>
        <button
          onClick={() => setActiveView('settings')}
          className={`w-full flex items-center rounded-lg text-sm font-medium apple-transition ${
            activeView === 'settings'
              ? 'bg-white/5 text-white border-l-2 border-apple-blue'
              : 'text-apple-gray hover:bg-white/[0.02] hover:text-white/90'
          } ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}`}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings className={`w-4 h-4 shrink-0 ${activeView === 'settings' ? 'text-apple-blue' : ''}`} />
          {!isCollapsed && <span>Settings</span>}
        </button>
        {!isCollapsed && (
          <div className="px-3 pt-2 pb-1 text-[11px] text-apple-gray/50 flex justify-between items-center">
            <span>Study Smarter</span>
            <span>v1.0.0</span>
          </div>
        )}
      </div>
    </aside>
  );
};
