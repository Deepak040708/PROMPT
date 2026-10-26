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
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-craft-cardBorder/40 bg-craft-surface/90 backdrop-blur-md transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Brand */}
          <div 
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-craft-card border border-craft-cardBorder p-0.5 shadow-sm group-hover:border-craft-primary transition-all duration-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-craft-accent group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg sm:text-xl tracking-wide text-craft-mainText group-hover:text-craft-accent transition-colors">
                  PromptCraft
                </span>
                <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] uppercase tracking-wider font-mono font-semibold bg-craft-card text-craft-primary border border-craft-cardBorder/60 rounded-full">
                  AI Architect
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-craft-mutedText hidden sm:block">
                Precision Prompt Engineering
              </p>
            </div>
          </div>

          {/* Desktop Navigation (Visible on tablet & desktop) */}
          <nav className="hidden sm:flex items-center gap-1.5 md:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 select-none cursor-pointer ${
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

      {/* Mobile Bottom Navigation Bar (Visible only on mobile screens < 640px) */}
      <nav 
        aria-label="Mobile Navigation" 
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0C1728]/95 backdrop-blur-xl border-t border-craft-cardBorder/80 px-2 py-1 flex items-center justify-around shadow-2xl"
        style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex-1 py-1.5 px-1 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all relative select-none min-h-[48px] active:scale-95 cursor-pointer ${
                isActive
                  ? 'text-craft-highlight font-semibold'
                  : 'text-craft-mutedText hover:text-craft-mainText'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-craft-primary' : 'text-craft-mutedText'}`} />
                {item.badge !== null && (
                  <span className="absolute -top-1 -right-2 px-1 text-[9px] font-mono font-bold bg-craft-primary text-craft-bg rounded-full min-w-[14px] text-center leading-tight">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-craft-primary"></span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
