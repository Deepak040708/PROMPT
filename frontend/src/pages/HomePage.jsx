import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  RotateCw, 
  Bookmark, 
  Edit3, 
  Save, 
  X, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/client';
import { copyTextToClipboard } from '../utils/clipboard';

export default function HomePage({
  currentPrompt,
  setCurrentPrompt,
  onPromptGenerated,
  onPromptUpdated,
  onPromptDeleted,
  addToast,
  navigateToTab
}) {
  const [idea, setIdea] = useState(currentPrompt?.original_idea || '');

  // In-flight state management to prevent duplicate requests
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isTogglingSave, setIsTogglingSave] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync edit text when current prompt changes
  React.useEffect(() => {
    if (currentPrompt) {
      setEditText(currentPrompt.generated_prompt);
      setIsEditing(false);
    }
  }, [currentPrompt]);

  const charCount = idea.length;
  const wordCount = idea.trim() ? idea.trim().split(/\s+/).length : 0;

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (isGenerating) return;

    const trimmed = idea.trim();
    if (!trimmed) {
      addToast('Please enter an idea before generating a prompt.', 'error');
      return;
    }

    setGenerationError(null);
    setIsGenerating(true);
    try {
      const result = await api.generatePrompt(trimmed);
      setCurrentPrompt(result);
      if (onPromptGenerated) onPromptGenerated(result);
      addToast('Prompt crafted successfully!', 'success');
    } catch (err) {
      const msg = err.message || 'Failed to generate prompt. Please retry in a moment.';
      setGenerationError(msg);
      addToast(msg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!currentPrompt || isRegenerating) return;
    setIsRegenerating(true);
    try {
      const result = await api.regeneratePrompt(
        currentPrompt.id,
        currentPrompt.original_idea
      );
      setCurrentPrompt(result);
      if (onPromptUpdated) onPromptUpdated(result);
      addToast('Alternative prompt generated!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to regenerate prompt.', 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!currentPrompt) return;
    const textToCopy = isEditing ? editText : currentPrompt.generated_prompt;
    const success = await copyTextToClipboard(textToCopy);
    if (success) {
      setCopied(true);
      addToast('Prompt copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } else {
      addToast('Could not access clipboard automatically. Please copy manually.', 'error');
    }
  };

  const handleSaveToggle = async () => {
    if (!currentPrompt || isTogglingSave) return;
    setIsTogglingSave(true);
    try {
      const updated = await api.toggleSavePrompt(currentPrompt.id);
      setCurrentPrompt(updated);
      if (onPromptUpdated) onPromptUpdated(updated);
      addToast(
        updated.is_saved ? 'Prompt saved to bookmarks!' : 'Prompt removed from bookmarks.',
        'success'
      );
    } catch (err) {
      addToast('Failed to update bookmark state.', 'error');
    } finally {
      setIsTogglingSave(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!currentPrompt || !editText.trim() || isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      const updated = await api.updatePrompt(currentPrompt.id, editText.trim());
      setCurrentPrompt(updated);
      if (onPromptUpdated) onPromptUpdated(updated);
      setIsEditing(false);
      addToast('Changes saved successfully!', 'success');
    } catch (err) {
      addToast('Failed to save changes.', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleGenerate();
    }
  };

  const setSampleIdea = (sample) => {
    setIdea(sample);
  };

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-4 sm:py-10 space-y-6 sm:space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-3 sm:space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-craft-surface border border-craft-cardBorder text-craft-accent text-[11px] sm:text-xs font-mono font-medium tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-craft-accent" />
          <span>AI Prompt Engineering</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl text-craft-mainText leading-tight tracking-normal">
          Turn rough thoughts into <br className="hidden sm:inline" />
          <span className="text-craft-accent italic">
            precision AI prompts
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-xs sm:text-base text-craft-mutedText leading-relaxed px-1">
          Enter an idea in any language, Thanglish, or casual phrasing. PromptCraft analyzes your intent, preserves your constraints, and outputs structured, high-impact prompts ready for AI tools.
        </p>
      </div>

      {/* Main Input Form */}
      <div className="bg-craft-surface border border-craft-inputBorder rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xl relative">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="relative">
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              placeholder="What's on your mind? (e.g. enaku oru study app venum students ku useful ah irukanum)"
              className="w-full p-3.5 sm:p-5 bg-craft-input border border-craft-inputBorder rounded-xl sm:rounded-2xl text-craft-mainText placeholder:text-craft-mutedText/60 focus:outline-none focus:border-craft-primary focus:ring-2 focus:ring-craft-primary/20 transition-all text-base sm:text-lg leading-relaxed resize-y min-h-[120px]"
            />
            {idea && (
              <button
                type="button"
                onClick={() => setIdea('')}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 text-craft-mutedText hover:text-craft-mainText bg-craft-surfaceHover rounded-lg transition-colors cursor-pointer"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick sample chips */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 text-xs">
            <span className="text-craft-mutedText font-medium text-[11px] sm:text-xs">Try:</span>
            <button
              type="button"
              onClick={() => setSampleIdea('enaku oru study app venum students ku useful ah irukanum')}
              className="px-2.5 py-1.5 bg-craft-surfaceHover hover:bg-craft-surfaceActive active:scale-95 border border-craft-inputBorder rounded-lg text-craft-mutedText hover:text-craft-mainText transition-all text-[11px] sm:text-xs min-h-[32px] flex items-center cursor-pointer"
            >
              🎓 Student Study App
            </button>
            <button
              type="button"
              onClick={() => setSampleIdea('Create an automated customer support triage system that tags urgent tickets')}
              className="px-2.5 py-1.5 bg-craft-surfaceHover hover:bg-craft-surfaceActive active:scale-95 border border-craft-inputBorder rounded-lg text-craft-mutedText hover:text-craft-mainText transition-all text-[11px] sm:text-xs min-h-[32px] flex items-center cursor-pointer"
            >
              ⚡ Support Ticket Triage
            </button>
            <button
              type="button"
              onClick={() => setSampleIdea('oru personal finance budget tracker thevai, monthly savings target maintain panna')}
              className="px-2.5 py-1.5 bg-craft-surfaceHover hover:bg-craft-surfaceActive active:scale-95 border border-craft-inputBorder rounded-lg text-craft-mutedText hover:text-craft-mainText transition-all text-[11px] sm:text-xs min-h-[32px] flex items-center cursor-pointer"
            >
              💰 Monthly Budget Tracker
            </button>
          </div>

          {/* Toolbar: Counter & Generate Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-craft-inputBorder/80">
            <div className="flex items-center justify-between sm:justify-start gap-3 text-xs text-craft-mutedText font-mono">
              <span className={charCount > 5000 ? 'text-craft-accent' : ''}>
                {charCount.toLocaleString()} chars
              </span>
              <span>•</span>
              <span>{wordCount} words</span>
              <span className="hidden sm:inline-block text-craft-mutedText/60">
                (Press Ctrl + Enter to generate)
              </span>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !idea.trim()}
              className="w-full sm:w-auto px-6 py-3 bg-craft-primary hover:bg-craft-primaryHover active:scale-[0.98] text-craft-bg font-bold rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed select-none min-h-[48px] text-sm sm:text-base cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-craft-bg/30 border-t-craft-bg rounded-full animate-spin"></span>
                  <span>Architecting Prompt...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-craft-bg" />
                  <span>Generate Prompt</span>
                </>
              )}
            </button>
          </div>

          {/* Inline Error with 1-Click Retry */}
          {generationError && (
            <div className="flex items-center justify-between gap-3 p-3.5 bg-craft-danger/10 border border-craft-danger/30 rounded-xl text-xs text-craft-danger animate-fade-in mt-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="leading-snug">{generationError}</span>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-3 py-1.5 bg-craft-danger/20 hover:bg-craft-danger/30 active:scale-95 text-craft-mainText rounded-lg font-medium transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                Retry Now
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Generated Result Card (Deep Slate Blue #1C3150 with #365477 Border) */}
      {currentPrompt && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl sm:text-2xl text-craft-mainText flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-craft-accent animate-pulse"></span>
              Generated Prompt
            </h2>
          </div>

          {/* Clarification banner if needed */}
          {currentPrompt.clarification_question && (
            <div className="p-3.5 sm:p-4 bg-craft-surface border border-craft-accent/30 rounded-2xl flex items-start gap-3 text-craft-mainText text-sm">
              <HelpCircle className="w-5 h-5 text-craft-accent shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-craft-accent font-serif text-base">Clarification Question</p>
                <p className="leading-relaxed text-xs sm:text-sm text-craft-mutedText">{currentPrompt.clarification_question}</p>
              </div>
            </div>
          )}

          <div className="bg-craft-card border border-craft-cardBorder rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl space-y-4">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-craft-cardBorder/60">
              <div className="text-[11px] sm:text-xs text-craft-mutedText font-mono font-medium">
                Target AI Prompt • Ready for ChatGPT, Claude, Gemini, Copilot
              </div>
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                {/* Copy Button */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-3 py-2.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[40px] active:scale-95 cursor-pointer ${
                    copied
                      ? 'bg-craft-primary/20 text-craft-highlight border border-craft-primary/30'
                      : 'bg-craft-surface hover:bg-craft-surfaceHover text-craft-mainText border border-craft-cardBorder/60'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4 text-craft-primary" /> : <Copy className="w-4 h-4 text-craft-mutedText" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                {/* Edit Toggle */}
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-2.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[40px] active:scale-95 cursor-pointer ${
                    isEditing
                      ? 'bg-craft-accent/20 text-craft-accent border border-craft-accent/40'
                      : 'bg-craft-surface hover:bg-craft-surfaceHover text-craft-mainText border border-craft-cardBorder/60'
                  }`}
                >
                  <Edit3 className="w-4 h-4 text-craft-mutedText" />
                  <span>{isEditing ? 'Editing' : 'Edit'}</span>
                </button>

                {/* Regenerate Button */}
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="px-3 py-2.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold bg-craft-surface hover:bg-craft-surfaceHover text-craft-mainText border border-craft-cardBorder/60 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 min-h-[40px] active:scale-95 cursor-pointer"
                  title="Generate alternative variation"
                >
                  <RotateCw className={`w-4 h-4 text-craft-primary ${isRegenerating ? 'animate-spin' : ''}`} />
                  <span>{isRegenerating ? 'Regenerating...' : 'Regenerate'}</span>
                </button>

                {/* Save Toggle */}
                <button
                  type="button"
                  onClick={handleSaveToggle}
                  disabled={isTogglingSave}
                  className={`px-3 py-2.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[40px] active:scale-95 cursor-pointer ${
                    currentPrompt.is_saved
                      ? 'bg-craft-accent/20 text-craft-accent border border-craft-accent/40'
                      : 'bg-craft-surface hover:bg-craft-surfaceHover text-craft-mainText border border-craft-cardBorder/60'
                  } disabled:opacity-50`}
                >
                  <Bookmark className={`w-4 h-4 ${currentPrompt.is_saved ? 'fill-craft-accent text-craft-accent' : 'text-craft-mutedText'}`} />
                  <span>{currentPrompt.is_saved ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>

            {/* Prompt Content Area */}
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={8}
                  className="w-full p-3.5 sm:p-4 bg-craft-surface border border-craft-primary/50 rounded-xl sm:rounded-2xl text-base sm:text-sm font-mono text-craft-promptText leading-relaxed focus:outline-none focus:ring-2 focus:ring-craft-primary/20 transition-all resize-y"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditText(currentPrompt.generated_prompt);
                      setIsEditing(false);
                    }}
                    disabled={isSavingEdit}
                    className="px-4 py-2.5 text-xs font-medium text-craft-mutedText hover:text-craft-mainText bg-craft-surface hover:bg-craft-surfaceHover border border-craft-cardBorder rounded-xl transition-all cursor-pointer min-h-[40px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isSavingEdit || !editText.trim()}
                    className="px-4 py-2.5 text-xs font-semibold text-craft-bg bg-craft-primary hover:bg-craft-primaryHover active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer min-h-[40px]"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingEdit ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-5 bg-[#152741] rounded-xl sm:rounded-2xl border border-craft-cardBorder/60 text-craft-promptText font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap selection:bg-craft-primary/40 selection:text-craft-highlight select-text overflow-x-auto break-words">
                {currentPrompt.generated_prompt}
              </div>
            )}

            {/* Original Idea Reference */}
            <div className="pt-3 border-t border-craft-cardBorder/40 flex items-start gap-2 text-xs text-craft-mutedText">
              <span className="font-semibold text-craft-mutedText">Based on:</span>
              <span className="italic text-craft-mainText break-words">"{currentPrompt.original_idea}"</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
