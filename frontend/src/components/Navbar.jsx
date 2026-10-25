import React from 'react';
import { Sparkles, History, Bookmark, Settings as SettingsIcon } from 'lucide-react';

export default function Navbar({ currentTab, setCurrentTab, savedCount = 0 }) {
  const navItems = [
    { id: 'home', label: 'Create', icon: Sparkles },
    { id: 'history', label: 'History', icon: History },
    { id: 'saved', label: 'Saved', icon: Bookmark, badge: savedCount > 0 ? savedCount : null },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-craft-cardBorder/40 bg-craft-surface/90 backdrop-blur-md transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => setCurrentTab('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-craft-card border border-craft-cardBorder p-0.5 shadow-sm group-hover:border-craft-primary transition-all duration-300 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-craft-accent group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl tracking-wide text-craft-mainText group-hover:text-craft-accent transition-colors">
                PromptCraft
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono font-semibold bg-craft-card text-craft-primary border border-craft-cardBorder/60 rounded-full">
                AI Architect
              </span>
            </div>
            <p className="text-[11px] text-craft-mutedText hidden sm:block">
              Precision Prompt Engineering
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 select-none ${
                  isActive
                    ? 'text-craft-promptText bg-craft-card border border-craft-cardBorder shadow-sm'
                    : 'text-craft-mutedText hover:text-craft-mainText hover:bg-craft-surfaceHover'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-craft-primary' : 'text-craft-mutedText'}`} />
                <span>{item.label}</span>
                {item.badge !== null && (
                  <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full ${
                    isActive 
                      ? 'bg-craft-primary text-craft-bg' 
                      : 'bg-craft-card text-craft-mutedText border border-craft-cardBorder'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-craft-primary rounded-full"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
