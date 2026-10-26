import React, { useState, useEffect } from 'react';
import { Bookmark, Search, RefreshCw, X, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import PromptCard from '../components/PromptCard';
import DeleteModal from '../components/DeleteModal';

export default function SavedPage({
  onSelectPromptForHome,
  onPromptUpdated,
  onPromptDeleted,
  addToast,
  navigateToTab
}) {
  const [prompts, setPrompts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const data = await api.getSaved(search);
      setPrompts(data.prompts || []);
    } catch (err) {
      addToast(err.message || 'Failed to load saved prompts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSaved();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSaveToggle = async (prompt) => {
    try {
      const res = await api.toggleSavePrompt(prompt.id);
      setPrompts((prev) => prev.filter((p) => p.id !== prompt.id));
      if (onPromptUpdated) onPromptUpdated(res);
      addToast('Prompt removed from bookmarks.', 'success');
    } catch (err) {
      addToast('Failed to update bookmark state.', 'error');
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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deletePrompt(deleteTarget.id);
      setPrompts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
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
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-4 sm:py-10 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-4xl text-craft-mainText flex items-center gap-2.5 sm:gap-3">
            <Bookmark className="w-6 h-6 sm:w-8 sm:h-8 text-craft-accent fill-craft-accent/20" />
            <span>Saved Prompts</span>
          </h1>
          <p className="text-xs sm:text-sm text-craft-mutedText mt-1">
            Your curated collection of high-value prompts ready for immediate use.
          </p>
        </div>
        <div className="text-xs font-mono text-craft-accent px-3 py-1.5 bg-craft-surface border border-craft-inputBorder rounded-xl self-start sm:self-auto font-semibold">
          {prompts.length} bookmarks
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-craft-mutedText/60 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search within saved prompts..."
          className="w-full pl-10 sm:pl-11 pr-10 py-2.5 sm:py-3 bg-craft-input border border-craft-inputBorder rounded-xl sm:rounded-2xl text-base sm:text-sm text-craft-mainText placeholder:text-craft-mutedText/50 focus:outline-none focus:border-craft-accent focus:ring-2 focus:ring-craft-accent/20 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-craft-mutedText hover:text-craft-mainText p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-craft-accent animate-spin mx-auto" />
          <p className="text-sm text-craft-mutedText font-mono">Loading saved prompts...</p>
        </div>
      ) : prompts.length === 0 ? (
        <div className="p-12 text-center bg-craft-surface/60 border border-craft-inputBorder rounded-3xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-craft-card border border-craft-cardBorder flex items-center justify-center mx-auto text-craft-accent">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg text-craft-mainText">No saved prompts yet</h3>
          <p className="text-sm text-craft-mutedText max-w-sm mx-auto leading-relaxed">
            {search
              ? `No saved prompts match "${search}".`
              : 'Click the bookmark icon on any prompt card to save it into your permanent collection.'}
          </p>
          {!search && (
            <button
              onClick={() => navigateToTab('home')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-craft-primary hover:bg-craft-primaryHover text-craft-bg text-xs font-semibold rounded-xl transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-craft-bg" />
              <span>Create Your First Prompt</span>
            </button>
          )}
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
