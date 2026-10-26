import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Bookmark, 
  RotateCw, 
  Edit3, 
  Trash2, 
  Clock, 
  HelpCircle, 
  Save, 
  X,
  ExternalLink,
  SlidersHorizontal
} from 'lucide-react';
import { formatDate } from '../utils/formatDate';
import { copyTextToClipboard } from '../utils/clipboard';

export default function PromptCard({
  prompt,
  onCopy,
  onSaveToggle,
  onRegenerate,
  onDeleteRequest,
  onUpdateText,
  onOpenInHome,
  addToast
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(prompt.generated_prompt);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isTogglingSave, setIsTogglingSave] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleCopy = async () => {
    const textToCopy = isEditing ? editText : prompt.generated_prompt;
    const success = await copyTextToClipboard(textToCopy);
    if (success) {
      setCopied(true);
      if (onCopy) onCopy(prompt);
      else if (addToast) addToast('Prompt copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } else {
      if (addToast) addToast('Could not access clipboard automatically. Please copy manually.', 'error');
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      if (onUpdateText) {
        await onUpdateText(prompt.id, editText.trim());
      }
      setIsEditing(false);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCancelEdit = () => {
    setEditText(prompt.generated_prompt);
    setIsEditing(false);
  };

  const handleSaveToggleClick = async () => {
    if (isTogglingSave) return;
    setIsTogglingSave(true);
    try {
      if (onSaveToggle) {
        await onSaveToggle(prompt);
      }
    } finally {
      setIsTogglingSave(false);
    }
  };

  const handleRegenerateClick = async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    try {
      if (onRegenerate) {
        await onRegenerate(prompt);
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  const hasOptionalParams = Boolean(
    prompt.purpose || prompt.context || prompt.output_format || prompt.constraints
  );

  return (
    <div className="group relative bg-craft-card border border-craft-cardBorder hover:border-craft-primary/60 rounded-2xl p-4 sm:p-6 transition-all duration-300 shadow-xl">
      {/* Header: Timestamp and Action toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4 pb-3 border-b border-craft-cardBorder/60">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-craft-mutedText font-mono">
            <Clock className="w-3.5 h-3.5 text-craft-primary" />
            <span>{formatDate(prompt.created_at)}</span>
          </span>

          {hasOptionalParams && (
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-[11px] text-craft-mutedText hover:text-craft-accent flex items-center gap-1 px-2 py-0.5 rounded-md bg-craft-surface border border-craft-inputBorder transition-colors font-mono cursor-pointer"
              title="View optional parameters"
            >
              <SlidersHorizontal className="w-3 h-3 text-craft-accent" />
              <span>{showDetails ? 'Hide Controls' : 'Customized'}</span>
            </button>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {/* Bookmark Toggle */}
          <button
            onClick={handleSaveToggleClick}
            disabled={isTogglingSave}
            className={`p-2 rounded-xl min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95 cursor-pointer transition-all ${
              prompt.is_saved
                ? 'text-craft-accent bg-craft-accent/10 border border-craft-accent/30 hover:bg-craft-accent/20'
                : 'text-craft-mutedText hover:text-craft-mainText hover:bg-craft-surfaceHover'
            } disabled:opacity-50`}
            title={prompt.is_saved ? 'Remove from saved' : 'Save prompt'}
            aria-label="Bookmark prompt"
          >
            <Bookmark className={`w-4 h-4 ${prompt.is_saved ? 'fill-craft-accent' : ''}`} />
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`p-2 rounded-xl min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95 cursor-pointer transition-all ${
              copied
                ? 'text-craft-primary bg-craft-primary/10 border border-craft-primary/30'
                : 'text-craft-mutedText hover:text-craft-mainText hover:bg-craft-surfaceHover'
            }`}
            title="Copy prompt"
            aria-label="Copy prompt"
          >
            {copied ? <Check className="w-4 h-4 text-craft-primary" /> : <Copy className="w-4 h-4 text-craft-mutedText" />}
          </button>

          {/* Edit Toggle */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`p-2 rounded-xl min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95 cursor-pointer transition-all ${
              isEditing
                ? 'text-craft-accent bg-craft-accent/10 border border-craft-accent/30'
                : 'text-craft-mutedText hover:text-craft-mainText hover:bg-craft-surfaceHover'
            }`}
            title="Edit prompt"
            aria-label="Edit prompt"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Regenerate Button */}
          <button
            onClick={handleRegenerateClick}
            disabled={isRegenerating}
            className="p-2 rounded-xl min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95 cursor-pointer text-craft-mutedText hover:text-craft-primary hover:bg-craft-surfaceHover transition-all disabled:opacity-50"
            title="Regenerate alternative"
            aria-label="Regenerate prompt"
          >
            <RotateCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin text-craft-primary' : ''}`} />
          </button>

          {/* Delete Button */}
          {onDeleteRequest && (
            <button
              onClick={() => onDeleteRequest(prompt)}
              className="p-2 rounded-xl min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95 cursor-pointer text-craft-mutedText hover:text-rose-400 hover:bg-rose-500/10 transition-all"
              title="Delete prompt"
              aria-label="Delete prompt"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Original Idea Section */}
      <div className="mb-3">
        <div className="text-xs uppercase tracking-wider font-mono font-semibold text-craft-mutedText mb-1">
          Original Idea
        </div>
        <p className="text-sm font-medium text-craft-mainText bg-craft-surface p-3.5 rounded-xl border border-craft-inputBorder leading-relaxed italic">
          "{prompt.original_idea}"
        </p>
      </div>

      {/* Optional Parameters breakdown if toggled */}
      {showDetails && hasOptionalParams && (
        <div className="mb-3 p-3.5 bg-craft-surface rounded-xl border border-craft-inputBorder space-y-1.5 text-xs text-craft-mutedText font-mono animate-fade-in">
          {prompt.purpose && (
            <div><span className="font-semibold text-craft-accent">Purpose:</span> {prompt.purpose}</div>
          )}
          {prompt.context && (
            <div><span className="font-semibold text-craft-accent">Context:</span> {prompt.context}</div>
          )}
          {prompt.output_format && (
            <div><span className="font-semibold text-craft-accent">Output Format:</span> {prompt.output_format}</div>
          )}
          {prompt.constraints && (
            <div><span className="font-semibold text-craft-accent">Constraints:</span> {prompt.constraints}</div>
          )}
        </div>
      )}

      {/* Clarification Notice if present */}
      {prompt.clarification_question && (
        <div className="mb-3 p-3.5 bg-craft-surface border border-craft-accent/30 rounded-xl flex items-start gap-2.5 text-xs text-craft-mainText">
          <HelpCircle className="w-4 h-4 text-craft-accent shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <span className="font-semibold text-craft-accent font-serif text-sm">Clarification Note: </span>
            <span className="text-craft-mutedText">{prompt.clarification_question}</span>
          </div>
        </div>
      )}

      {/* Generated Prompt Content Area (Exact #1C3150 surface, #F0F5FC text, #9FC5FF selection) */}
      <div className="mt-2">
        <div className="text-xs uppercase tracking-wider font-mono font-semibold text-craft-primary mb-1.5 flex items-center justify-between">
          <span>Actionable Prompt</span>
          {onOpenInHome && (
            <button
              onClick={() => onOpenInHome(prompt)}
              className="text-craft-mutedText hover:text-craft-highlight text-xs flex items-center gap-1 transition-colors font-sans"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Load in Editor</span>
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={8}
              className="w-full p-3.5 sm:p-4 bg-craft-surface border border-craft-primary/60 rounded-xl text-base sm:text-sm text-craft-promptText font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-craft-primary/20 transition-all resize-y"
              placeholder="Edit your prompt..."
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSavingEdit}
                className="px-3.5 py-2 text-xs font-medium text-craft-mutedText hover:text-craft-mainText bg-craft-surface hover:bg-craft-surfaceHover border border-craft-inputBorder rounded-lg transition-all flex items-center gap-1.5 cursor-pointer min-h-[38px]"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit || !editText.trim()}
                className="px-4 py-2 text-xs font-semibold text-craft-bg bg-craft-primary hover:bg-craft-primaryHover active:scale-95 rounded-lg shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer min-h-[38px]"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingEdit ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3.5 sm:p-4 bg-[#152741] rounded-xl border border-craft-cardBorder text-xs sm:text-sm font-mono text-craft-promptText leading-relaxed whitespace-pre-wrap selection:bg-craft-primary/40 selection:text-craft-highlight break-words overflow-x-auto">
            {prompt.generated_prompt}
          </div>
        )}
      </div>
    </div>
  );
}
