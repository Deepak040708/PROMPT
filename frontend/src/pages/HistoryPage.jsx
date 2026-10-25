import React, { useState, useEffect } from 'react';
import { Search, History as HistoryIcon, Bookmark, RefreshCw, X } from 'lucide-react';
import { api } from '../api/client';
import PromptCard from '../components/PromptCard';
import DeleteModal from '../components/DeleteModal';

export default function HistoryPage({
  onSelectPromptForHome,
  onPromptUpdated,
  onPromptDeleted,
  addToast
}) {
  const [prompts, setPrompts] = useState([]);
  const [search, setSearch] = useState('');
  const [savedFilter, setSavedFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const data = savedFilter
        ? await api.getSaved(search)
        : await api.getHistory(search);
      setPrompts(data.prompts || []);
      setTotal(data.total || 0);
    } catch (err) {
      addToast(err.message || 'Failed to load history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPrompts();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, savedFilter]);

  const handleSaveToggle = async (prompt) => {
    try {
      const res = await api.toggleSavePrompt(prompt.id);
      setPrompts((prev) =>
        prev.map((p) => (p.id === res.id ? res : p))
      );
      if (onPromptUpdated) onPromptUpdated(res);
      addToast(res.is_saved ? 'Prompt saved to bookmarks!' : 'Prompt removed from bookmarks.', 'success');
    } catch (err) {
      addToast('Failed to update bookmark state.', 'error');
    }
  };

  const handleRegenerate = async (prompt) => {
    try {
      const res = await api.regeneratePrompt(prompt.id, prompt.original_idea);
      setPrompts((prev) =>
        prev.map((p) => (p.id === res.id ? res : p))
      );
      if (onPromptUpdated) onPromptUpdated(res);
      addToast('Alternative prompt generated!', 'success');
    } catch (err) {
      addToast('Failed to regenerate prompt.', 'error');
    }
  };

  const handleUpdateText = async (id, newText) => {
    const res = await api.updatePrompt(id, newText);
    setPrompts((prev) =>
      prev.map((p) => (p.id === res.id ? res : p))
    );
    if (onPromptUpdated) onPromptUpdated(res);
    addToast('Prompt changes saved!', 'success');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deletePrompt(deleteTarget.id);
      setPrompts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setTotal((prev) => Math.max(0, prev - 1));
      if (onPromptDeleted) onPromptDeleted(deleteTarget.id);
      addToast('Prompt deleted successfully.', 'success');
      setDeleteTarget(null);
    } catch (err) {
      addToast('Failed to delete prompt.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-craft-mainText flex items-center gap-3">
            <HistoryIcon className="w-8 h-8 text-craft-primary" />
            <span>Prompt History</span>
          </h1>
          <p className="text-sm text-craft-mutedText mt-1">
            Browse, search, edit, or regenerate your previous prompts.
          </p>
        </div>
        <div className="text-xs font-mono text-craft-mutedText px-3.5 py-1.5 bg-craft-surface border border-craft-inputBorder rounded-xl self-start sm:self-auto">
          {total} total records
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-craft-mutedText/60 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts by keyword, purpose, or context..."
            className="w-full pl-11 pr-10 py-3 bg-craft-input border border-craft-inputBorder rounded-2xl text-sm text-craft-mainText placeholder:text-craft-mutedText/50 focus:outline-none focus:border-craft-primary focus:ring-2 focus:ring-craft-primary/20 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-craft-mutedText hover:text-craft-mainText p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSavedFilter(false)}
            className={`px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
              !savedFilter
                ? 'bg-craft-primary text-craft-bg shadow-sm'
                : 'bg-craft-surface hover:bg-craft-surfaceHover text-craft-mutedText border border-craft-inputBorder'
            }`}
          >
            All Prompts
          </button>
          <button
            onClick={() => setSavedFilter(true)}
            className={`px-4 py-3 rounded-2xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              savedFilter
                ? 'bg-craft-accent text-craft-bg shadow-sm'
                : 'bg-craft-surface hover:bg-craft-surfaceHover text-craft-mutedText border border-craft-inputBorder'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved Only</span>
          </button>
        </div>
      </div>

      {/* Prompts List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-craft-primary animate-spin mx-auto" />
          <p className="text-sm text-craft-mutedText font-mono">Loading prompt history...</p>
        </div>
      ) : prompts.length === 0 ? (
        <div className="p-12 text-center bg-craft-surface/60 border border-craft-inputBorder rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-craft-card border border-craft-cardBorder flex items-center justify-center mx-auto text-craft-mutedText">
            <HistoryIcon className="w-6 h-6 text-craft-primary" />
          </div>
          <h3 className="font-serif text-lg text-craft-mainText">No prompts found</h3>
          <p className="text-sm text-craft-mutedText max-w-sm mx-auto leading-relaxed">
            {search
              ? `No prompts matched your search query "${search}". Try searching for another keyword.`
              : 'You have not generated any prompts yet. Head over to the Create tab to start!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {prompts.map((p) => (
            <PromptCard
              key={p.id}
              prompt={p}
              onCopy={() => addToast('Prompt copied to clipboard!', 'success')}
              onSaveToggle={handleSaveToggle}
              onRegenerate={handleRegenerate}
              onDeleteRequest={(item) => setDeleteTarget(item)}
              onUpdateText={handleUpdateText}
              onOpenInHome={(item) => onSelectPromptForHome(item)}
              addToast={addToast}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        promptTitle={deleteTarget?.original_idea}
        isDeleting={isDeleting}
      />
    </div>
  );
}
