import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import SavedPage from './pages/SavedPage';
import SettingsPage from './pages/SettingsPage';
import { api } from './api/client';
import { Sparkles, Terminal, Database, ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [recentPrompts, setRecentPrompts] = useState([]);
  const [savedCount, setSavedCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  // Toast notification helper
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load initial recents & saved count on startup
  const refreshGlobalState = async () => {
    try {
      const historyData = await api.getHistory('', 5, 0);
      setRecentPrompts(historyData.prompts || []);
      const savedData = await api.getSaved('', 1, 0);
      setSavedCount(savedData.total || 0);
    } catch (err) {
      console.warn('Initial fetch error:', err.message);
    }
  };

  useEffect(() => {
    refreshGlobalState();
  }, []);

  // Handlers for synchronizing state across tabs
  const handlePromptGenerated = (newPrompt) => {
    setRecentPrompts((prev) => [newPrompt, ...prev.filter((p) => p.id !== newPrompt.id)]);
  };

  const handlePromptUpdated = (updated) => {
    if (currentPrompt?.id === updated.id) {
      setCurrentPrompt(updated);
    }
    setRecentPrompts((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    // Refresh saved count
    api.getSaved('', 1, 0).then((data) => setSavedCount(data.total || 0)).catch(() => {});
  };

  const handlePromptDeleted = (deletedId) => {
    if (currentPrompt?.id === deletedId) {
      setCurrentPrompt(null);
    }
    setRecentPrompts((prev) => prev.filter((p) => p.id !== deletedId));
    api.getSaved('', 1, 0).then((data) => setSavedCount(data.total || 0)).catch(() => {});
  };

  const handleSelectPromptForHome = (prompt) => {
    setCurrentPrompt(prompt);
    setCurrentTab('home');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-craft-bg text-craft-mainText selection:bg-craft-primary/30 selection:text-craft-highlight font-sans">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        savedCount={savedCount}
      />

      {/* Main Content View */}
      <main className="flex-1 pb-16">
        {currentTab === 'home' && (
          <HomePage
            currentPrompt={currentPrompt}
            setCurrentPrompt={setCurrentPrompt}
            onPromptGenerated={handlePromptGenerated}
            onPromptUpdated={handlePromptUpdated}
            onPromptDeleted={handlePromptDeleted}
            addToast={addToast}
            navigateToTab={setCurrentTab}
          />
        )}

        {currentTab === 'history' && (
          <HistoryPage
            onSelectPromptForHome={handleSelectPromptForHome}
            onPromptUpdated={handlePromptUpdated}
            onPromptDeleted={handlePromptDeleted}
            addToast={addToast}
          />
        )}

        {currentTab === 'saved' && (
          <SavedPage
            onSelectPromptForHome={handleSelectPromptForHome}
            onPromptUpdated={handlePromptUpdated}
            onPromptDeleted={handlePromptDeleted}
            addToast={addToast}
            navigateToTab={setCurrentTab}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsPage addToast={addToast} />
        )}
      </main>

      {/* Modern Refined Footer */}
      <footer className="border-t border-craft-borderSubtle bg-craft-surface/60 py-8 text-xs text-craft-mutedText">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-craft-accent" />
            <span className="font-bold text-craft-mainText">PromptCraft</span>
            <span className="text-craft-mutedText">— Intelligent AI Prompt Architecture</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-craft-mutedText font-mono text-[11px]">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-craft-primary" />
              <span>FastAPI + Vite</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-craft-primary" />
              <span>SQLite Persistence</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-craft-primary" />
              <span>Gemini Engine</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
