import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Key, 
  Cpu, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Database,
  Save
} from 'lucide-react';
import { api } from '../api/client';

export default function SettingsPage({ addToast }) {
  const [settings, setSettings] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
      setModelInput(data.model);
    } catch (err) {
      addToast(err.message || 'Failed to load settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await api.testConnection();
      setTestResult({
        success: true,
        message: `Connected successfully to ${result.model} (${result.latency_ms} ms)`,
        preview: result.sample_prompt_preview
      });
      addToast('AI Provider connection confirmed!', 'success');
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed.'
      });
      addToast('AI Connection test failed.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {};
      if (apiKeyInput.trim()) payload.api_key = apiKeyInput.trim();
      if (modelInput.trim()) payload.model = modelInput.trim();

      const updated = await api.updateSettings(payload);
      setSettings(updated);
      setApiKeyInput('');
      addToast('Settings updated successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-3">
        <RefreshCw className="w-6 h-6 text-craft-primary animate-spin mx-auto" />
        <p className="text-sm text-craft-mutedText font-mono">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl text-craft-mainText flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-craft-primary" />
          <span>System & AI Configuration</span>
        </h1>
        <p className="text-sm text-craft-mutedText mt-1">
          Inspect your AI model provider credentials, parameters, and SQLite database storage.
        </p>
      </div>

      {/* Provider Status Card */}
      <div className="bg-craft-surface border border-craft-inputBorder rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-craft-inputBorder/80">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              settings?.configured 
                ? 'bg-craft-card border border-craft-cardBorder text-craft-accent' 
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}>
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg text-craft-mainText">Google Gemini Engine</h3>
                <span className={`px-2 py-0.5 text-[11px] font-mono font-semibold rounded-full border ${
                  settings?.configured
                    ? 'bg-craft-primary/10 border-craft-primary/30 text-craft-highlight'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  {settings?.configured ? 'Active & Ready' : 'Needs Key'}
                </span>
              </div>
              <p className="text-xs text-craft-mutedText mt-0.5 font-mono">
                Model: <span className="text-craft-mainText">{settings?.model || 'gemini-3.8-flash'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-4 py-2.5 bg-craft-card hover:bg-craft-cardHover text-craft-mainText text-xs font-semibold rounded-xl border border-craft-cardBorder transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Activity className={`w-4 h-4 text-craft-primary ${isTesting ? 'animate-pulse' : ''}`} />
            <span>{isTesting ? 'Testing Connectivity...' : 'Test AI Connection'}</span>
          </button>
        </div>

        {/* Test Result Banner */}
        {testResult && (
          <div className={`p-4 rounded-2xl border text-sm animate-fade-in ${
            testResult.success 
              ? 'bg-craft-card border-craft-cardBorder text-craft-promptText' 
              : 'bg-rose-950/40 border-rose-800 text-rose-200'
          }`}>
            <div className="flex items-start gap-2.5">
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-craft-primary shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">{testResult.message}</p>
                {testResult.preview && (
                  <p className="text-xs text-craft-mutedText font-mono italic">
                    Sample output: "{testResult.preview}"
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-craft-input rounded-2xl border border-craft-inputBorder">
            <div className="flex items-center gap-2 text-xs text-craft-mutedText mb-1">
              <Key className="w-4 h-4 text-craft-primary" />
              <span>API Key Status</span>
            </div>
            <div className="text-sm font-mono text-craft-mainText flex items-center gap-1.5">
              {settings?.has_api_key ? (
                <>
                  <span className="text-craft-accent tracking-widest font-mono">••••••••</span>
                  <span className="text-xs text-craft-highlight font-sans">(Secure & Active)</span>
                </>
              ) : (
                <span className="text-xs text-rose-400 font-sans">Not Configured</span>
              )}
            </div>
          </div>

          <div className="p-4 bg-craft-input rounded-2xl border border-craft-inputBorder">
            <div className="flex items-center gap-2 text-xs text-craft-mutedText mb-1">
              <Cpu className="w-4 h-4 text-craft-primary" />
              <span>Current Model</span>
            </div>
            <div className="text-sm font-mono text-craft-mainText">
              {settings?.model}
            </div>
          </div>

          <div className="p-4 bg-craft-input rounded-2xl border border-craft-inputBorder">
            <div className="flex items-center gap-2 text-xs text-craft-mutedText mb-1">
              <Database className="w-4 h-4 text-craft-primary" />
              <span>Persistence</span>
            </div>
            <div className="text-sm font-mono text-craft-accent">
              SQLite (prompts.db)
            </div>
          </div>
        </div>

        {/* Update Form */}
        <form onSubmit={handleSaveSettings} className="space-y-4 pt-4 border-t border-craft-inputBorder/80">
          <h4 className="font-serif text-base text-craft-mainText flex items-center gap-2">
            <Key className="w-4 h-4 text-craft-primary" />
            <span>Update Credentials / Model</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-craft-mutedText mb-1.5">
                New API Key (optional)
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Leave blank to keep current key"
                className="w-full px-4 py-2.5 bg-craft-input border border-craft-inputBorder rounded-xl text-sm text-craft-mainText placeholder:text-craft-mutedText/40 focus:outline-none focus:border-craft-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-craft-mutedText mb-1.5">
                Model Name
              </label>
              <input
                type="text"
                value={modelInput}
                onChange={(e) => setModelInput(e.target.value)}
                placeholder="gemini-3.8-flash"
                className="w-full px-4 py-2.5 bg-craft-input border border-craft-inputBorder rounded-xl text-sm text-craft-mainText font-mono focus:outline-none focus:border-craft-primary"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-craft-primary hover:bg-craft-primaryHover text-craft-bg font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Updating...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security & Architecture Information Card */}
      <div className="bg-craft-surface/60 border border-craft-inputBorder rounded-3xl p-6 space-y-4 text-xs text-craft-mutedText leading-relaxed">
        <h4 className="font-serif text-base text-craft-mainText flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-craft-accent" />
          <span>Security & Architecture Design</span>
        </h4>
        <ul className="list-disc list-inside space-y-1.5 text-craft-mainText">
          <li>
            <strong>Server-Side Protection:</strong> The Gemini API key is securely stored in backend environment variables and is never transmitted or exposed in frontend client bundles.
          </li>
          <li>
            <strong>Local Persistence:</strong> All generated prompts, edits, and bookmarks are preserved in an indexed SQLite database (<code className="text-craft-accent font-mono">prompts.db</code>).
          </li>
          <li>
            <strong>Automatic Failover:</strong> The backend automatically detects temporary provider traffic surges and routes requests through alternative flash models to ensure high availability.
          </li>
        </ul>
      </div>
    </div>
  );
}
