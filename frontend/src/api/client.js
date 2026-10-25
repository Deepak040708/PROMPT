const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = { detail: await response.text() };
  }

  if (!response.ok) {
    const errorMsg = data?.detail || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Prompts with optional generation controls
  generatePrompt: (idea, options = {}) =>
    request('/prompts/generate', {
      method: 'POST',
      body: JSON.stringify({
        idea,
        purpose: options.purpose || null,
        context: options.context || null,
        output_format: options.output_format || null,
        constraints: options.constraints || null,
      })
    }),

  regeneratePrompt: (id, originalIdea = null, instruction = null, options = {}) =>
    request('/prompts/regenerate', {
      method: 'POST',
      body: JSON.stringify({
        id,
        original_idea: originalIdea,
        instruction,
        purpose: options.purpose || null,
        context: options.context || null,
        output_format: options.output_format || null,
        constraints: options.constraints || null,
      })
    }),

  getHistory: (search = '', limit = 50, offset = 0) => {
    const params = new URLSearchParams({ limit, offset });
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    return request(`/prompts/history?${params.toString()}`);
  },

  getSaved: (search = '', limit = 50, offset = 0) => {
    const params = new URLSearchParams({ limit, offset });
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    return request(`/prompts/saved?${params.toString()}`);
  },

  getPrompt: (id) => request(`/prompts/${id}`),

  updatePrompt: (id, generatedPrompt) =>
    request(`/prompts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ generated_prompt: generatedPrompt })
    }),

  toggleSavePrompt: (id, isSaved = null) =>
    request(`/prompts/${id}/save`, {
      method: 'PATCH',
      body: JSON.stringify(isSaved !== null ? { is_saved: isSaved } : {})
    }),

  deletePrompt: (id) =>
    request(`/prompts/${id}`, {
      method: 'DELETE'
    }),

  // Settings & Health
  getSettings: () => request('/settings'),

  updateSettings: (payload) =>
    request('/settings', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  testConnection: () =>
    request('/settings/test', {
      method: 'POST'
    }),

  getHealth: () => request('/health')
};
