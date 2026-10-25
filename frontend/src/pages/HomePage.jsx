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
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../api/client';
import { copyTextToClipboard } from '../utils/clipboard';
import PromptCard from '../components/PromptCard';

export default function HomePage({
  currentPrompt,
  setCurrentPrompt,
  recentPrompts,
  onPromptGenerated,
  onPromptUpdated,
  onPromptDeleted,
  addToast,
  navigateToTab
}) {
  const [idea, setIdea] = useState(currentPrompt?.original_idea || '');
  
  // Optional Generation Controls
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [context, setContext] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [constraints, setConstraints] = useState('');

  // In-flight state management to prevent duplicate requests
  const [isGenerating, setIsGenerating] = useState(false);
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

    setIsGenerating(true);
    try {
      const options = {
        purpose: purpose.trim() || undefined,
        context: context.trim() || undefined,
        output_format: outputFormat.trim() || undefined,
        constraints: constraints.trim() || undefined,
      };

      const result = await api.generatePrompt(trimmed, options);
      setCurrentPrompt(result);
      if (onPromptGenerated) onPromptGenerated(result);
      addToast('Prompt crafted successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to generate prompt. Check AI settings.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!currentPrompt || isRegenerating) return;
    setIsRegenerating(true);
    try {
      const options = {
        purpose: purpose.trim() || currentPrompt.purpose || undefined,
        context: context.trim() || currentPrompt.context || undefined,
        output_format: outputFormat.trim() || currentPrompt.output_format || undefined,
        constraints: constraints.trim() || currentPrompt.constraints || undefined,
      };

      const result = await api.regeneratePrompt(
        currentPrompt.id,
        currentPrompt.original_idea,
        null,
        options
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

  const clearControls = () => {
    setPurpose('');
    setContext('');
    setOutputFormat('');
    setConstraints('');
  };

  const hasActiveControls = Boolean(purpose || context || outputFormat || constraints);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-10">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-craft-surface border border-craft-cardBorder text-craft-accent text-xs font-mono font-medium tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-craft-accent" />
          <span>AI Prompt Engineering</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl text-craft-mainText leading-tight tracking-normal">
          Turn rough thoughts into <br className="hidden sm:inline" />
          <span className="text-craft-accent italic">
            precision AI prompts
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-craft-mutedText leading-relaxed">
          Enter an idea in any language, Thanglish, or casual phrasing. PromptCraft analyzes your intent, preserves your constraints, and outputs structured, high-impact prompts ready for AI tools.
        </p>
      </div>

      {/* Main Input Form */}
      <div className="bg-craft-surface border border-craft-inputBorder rounded-3xl p-5 sm:p-7 shadow-xl relative">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="relative">
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              placeholder="What's on your mind? (e.g. enaku oru study app venum students ku useful ah irukanum)"
              className="w-full p-4 sm:p-5 bg-craft-input border border-craft-inputBorder rounded-2xl text-craft-mainText placeholder:text-craft-mutedText/60 focus:outline-none focus:border-craft-primary focus:ring-2 focus:ring-craft-primary/20 transition-all text-base sm:text-lg leading-relaxed resize-y"
            />
            {idea && (
              <button
                type="button"
                onClick={() => setIdea('')}
                className="absolute top-4 right-4 p-1.5 text-craft-mutedText hover:text-craft-mainText bg-craft-surfaceHover rounded-lg transition-colors"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick sample chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-craft-mutedText font-medium">Try:</span>
            <button
              type="button"
              onClick={() => setSampleIdea('enaku oru study app venum students ku useful ah irukanum')}
              className="px-2.5 py-1 bg-craft-surfaceHover hover:bg-craft-surfaceActive border border-craft-inputBorder rounded-lg text-craft-mutedText hover:text-craft-mainText transition-colors"
            >
              🎓 Student Study App
            </button>
            <button
              type="button"
              onClick={() => setSampleIdea('Create an automated customer support triage system that tags urgent tickets')}
              className="px-2.5 py-1 bg-craft-surfaceHover hover:bg-craft-surfaceActive border border-craft-inputBorder rounded-lg text-craft-mutedText hover:text-craft-mainText transition-colors"
            >
              ⚡ Support Ticket Triage
            </button>
            <button
              type="button"
              onClick={() => setSampleIdea('oru personal finance budget tracker thevai, monthly savings target maintain panna')}
              className="px-2.5 py-1 bg-craft-surfaceHover hover:bg-craft-surfaceActive border border-craft-inputBorder rounded-lg text-craft-mutedText hover:text-craft-mainText transition-colors"
            >
              💰 Monthly Budget Tracker
            </button>
          </div>

          {/* Optional Generation Controls Accordion */}
          <div className="border border-craft-inputBorder rounded-2xl bg-craft-bg/40 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-semibold text-craft-mutedText hover:text-craft-mainText transition-colors"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-craft-primary" />
                <span>Optional Details & Constraints</span>
                {hasActiveControls && (
                  <span className="w-2 h-2 rounded-full bg-craft-accent"></span>
                )}
              </div>
              <div className="flex items-center gap-2 text-craft-mutedText">
                <span className="text-[11px] font-normal hidden sm:inline">
                  {showAdvanced ? 'Collapse options' : 'Customize purpose, context, format'}
                </span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showAdvanced && (
              <div className="p-4 pt-1 border-t border-craft-inputBorder/60 space-y-3 animate-fade-in text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-craft-mutedText mb-1 font-medium">
                      Prompt Purpose / Goal (optional)
                    </label>
                    <input
                      type="text"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="e.g. Architecting a full-stack production spec"
                      className="w-full px-3 py-2 bg-craft-surface border border-craft-inputBorder rounded-xl text-craft-mainText placeholder:text-craft-mutedText/50 focus:outline-none focus:border-craft-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-craft-mutedText mb-1 font-medium">
                      Desired Output Format (optional)
                    </label>
                    <input
                      type="text"
                      value={outputFormat}
                      onChange={(e) => setOutputFormat(e.target.value)}
                      placeholder="e.g. Structured markdown with numbered checklist"
                      className="w-full px-3 py-2 bg-craft-surface border border-craft-inputBorder rounded-xl text-craft-mainText placeholder:text-craft-mutedText/50 focus:outline-none focus:border-craft-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-craft-mutedText mb-1 font-medium">
                      Additional Context & Requirements (optional)
                    </label>
                    <input
                      type="text"
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="e.g. Offline-first mobile support, dark mode by default"
                      className="w-full px-3 py-2 bg-craft-surface border border-craft-inputBorder rounded-xl text-craft-mainText placeholder:text-craft-mutedText/50 focus:outline-none focus:border-craft-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-craft-mutedText mb-1 font-medium">
                      Constraints / Things to Avoid (optional)
                    </label>
                    <input
                      type="text"
                      value={constraints}
                      onChange={(e) => setConstraints(e.target.value)}
                      placeholder="e.g. No paid external libraries, keep dependencies minimal"
                      className="w-full px-3 py-2 bg-craft-surface border border-craft-inputBorder rounded-xl text-craft-mainText placeholder:text-craft-mutedText/50 focus:outline-none focus:border-craft-primary"
                    />
                  </div>
                </div>

                {hasActiveControls && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={clearControls}
                      className="text-craft-mutedText hover:text-craft-mainText text-[11px] underline"
                    >
                      Clear optional fields
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Toolbar: Counter & Generate Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-craft-inputBorder/80">
            <div className="flex items-center gap-3 text-xs text-craft-mutedText font-mono">
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
              className="w-full sm:w-auto px-6 py-3 bg-craft-primary hover:bg-craft-primaryHover text-craft-bg font-bold rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed select-none"
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
        </form>
      </div>

      {/* Generated Result Card (Deep Slate Blue #1C3150 with #365477 Border) */}
      {currentPrompt && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl text-craft-mainText flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-craft-accent animate-pulse"></span>
              Generated Prompt
            </h2>
          </div>

          {/* Clarification banner if needed */}
          {currentPrompt.clarification_question && (
            <div className="p-4 bg-craft-surface border border-craft-accent/30 rounded-2xl flex items-start gap-3 text-craft-mainText text-sm">
              <HelpCircle className="w-5 h-5 text-craft-accent shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-craft-accent font-serif text-base">Clarification Question</p>
                <p className="leading-relaxed text-craft-mutedText">{currentPrompt.clarification_question}</p>
              </div>
            </div>
          )}

          <div className="bg-craft-card border border-craft-cardBorder rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-craft-cardBorder/60">
              <div className="text-xs text-craft-mutedText font-mono font-medium">
                Target AI Prompt • Ready for ChatGPT, Claude, Gemini, Copilot
              </div>
              <div className="flex items-center gap-2">
                {/* Copy Button */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
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
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
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
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-craft-surface hover:bg-craft-surfaceHover text-craft-mainText border border-craft-cardBorder/60 transition-all flex items-center gap-1.5 disabled:opacity-50"
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
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
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

            {/* Prompt Content Area with Exact Colors: #1C3150 card, #F0F5FC text, #9FC5FF highlight */}
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={10}
                  className="w-full p-4 bg-craft-surface border border-craft-primary/50 rounded-2xl text-sm font-mono text-craft-promptText leading-relaxed focus:outline-none focus:ring-2 focus:ring-craft-primary/20 transition-all resize-y"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditText(currentPrompt.generated_prompt);
                      setIsEditing(false);
                    }}
                    disabled={isSavingEdit}
                    className="px-4 py-2 text-xs font-medium text-craft-mutedText hover:text-craft-mainText bg-craft-surface hover:bg-craft-surfaceHover border border-craft-cardBorder rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isSavingEdit || !editText.trim()}
                    className="px-4 py-2 text-xs font-semibold text-craft-bg bg-craft-primary hover:bg-craft-primaryHover rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingEdit ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-[#152741] rounded-2xl border border-craft-cardBorder/60 text-craft-promptText font-mono text-sm leading-relaxed whitespace-pre-wrap selection:bg-craft-primary/40 selection:text-craft-highlight select-text">
                {currentPrompt.generated_prompt}
              </div>
            )}

            {/* Original Idea Reference */}
            <div className="pt-3 border-t border-craft-cardBorder/40 flex items-start gap-2 text-xs text-craft-mutedText">
              <span className="font-semibold text-craft-mutedText">Based on:</span>
              <span className="italic text-craft-mainText">"{currentPrompt.original_idea}"</span>
            </div>
          </div>
        </div>
      )}

      {/* Recently Generated Section */}
      {recentPrompts && recentPrompts.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-craft-cardBorder/40">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl text-craft-mainText">Recent Generations</h3>
            <button
              onClick={() => navigateToTab('history')}
              className="text-xs text-craft-primary hover:text-craft-highlight font-mono font-medium transition-colors"
            >
              View Full History →
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {recentPrompts.slice(0, 3).map((p) => (
              <PromptCard
                key={p.id}
                prompt={p}
                onCopy={() => addToast('Prompt copied to clipboard!', 'success')}
                onSaveToggle={async (item) => {
                  const res = await api.toggleSavePrompt(item.id);
                  if (onPromptUpdated) onPromptUpdated(res);
                  addToast(res.is_saved ? 'Prompt saved!' : 'Prompt unsaved.', 'success');
                }}
                onRegenerate={async (item) => {
                  const res = await api.regeneratePrompt(item.id, item.original_idea);
                  if (onPromptUpdated) onPromptUpdated(res);
                  setCurrentPrompt(res);
                  addToast('Alternative generated!', 'success');
                }}
                onUpdateText={async (id, text) => {
                  const res = await api.updatePrompt(id, text);
                  if (onPromptUpdated) onPromptUpdated(res);
                  if (currentPrompt?.id === id) setCurrentPrompt(res);
                  addToast('Changes saved!', 'success');
                }}
                onOpenInHome={(item) => {
                  setCurrentPrompt(item);
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                addToast={addToast}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
