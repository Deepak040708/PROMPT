const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

let inMemoryDeviceId = null;

export function getDeviceId() {
  if (typeof window === 'undefined') return 'server';
  if (inMemoryDeviceId) return inMemoryDeviceId;
  try {
    let deviceId = localStorage.getItem('promptcraft_device_id');
    if (!deviceId || typeof deviceId !== 'string' || deviceId.trim().length === 0) {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        deviceId = crypto.randomUUID();
      } else {
        deviceId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 11);
      }
      try {
        localStorage.setItem('promptcraft_device_id', deviceId);
      } catch (storageErr) {
        // Quota exceeded or private browsing restricted
      }
    }
    inMemoryDeviceId = deviceId;
    return deviceId;
  } catch (e) {
    if (!inMemoryDeviceId) {
      inMemoryDeviceId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 11);
    }
    return inMemoryDeviceId;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const deviceId = getDeviceId();
  const headers = {
    'Content-Type': 'application/json',
    'X-Device-ID': deviceId,
    ...(options.headers || {})
  };

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr) {
    if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io') && (!import.meta.env.VITE_API_BASE_URL || API_BASE === '/api')) {
      throw new Error(
        'GitHub Pages hosts the static UI only. To enable live AI generation, connect a hosted backend URL via VITE_API_BASE_URL.'
      );
    }
    throw netErr;
  }

  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = { detail: await response.text() };
  }

  if (!response.ok) {
    if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io') && (!import.meta.env.VITE_API_BASE_URL || API_BASE === '/api')) {
      throw new Error(
        'GitHub Pages hosts the static UI only. To enable live AI generation, connect a hosted backend URL via VITE_API_BASE_URL.'
      );
    }
    const errorMsg = data?.detail || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  getDeviceId,

  // Prompts with optional generation controls and device scoping
  generatePrompt: (idea, options = {}) =>
    request('/prompts/generate', {
      method: 'POST',
      body: JSON.stringify({
        idea,
        purpose: options.purpose || null,
        context: options.context || null,
        output_format: options.output_format || null,
        constraints: options.constraints || null,
        device_id: getDeviceId(),
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
        device_id: getDeviceId(),
      })
    }),

  getHistory: (search = '', limit = 50, offset = 0) => {
    const params = new URLSearchParams({ limit, offset, device_id: getDeviceId() });
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    return request(`/prompts/history?${params.toString()}`);
  },

  getSaved: (search = '', limit = 50, offset = 0) => {
    const params = new URLSearchParams({ limit, offset, device_id: getDeviceId() });
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    return request(`/prompts/saved?${params.toString()}`);
  },

  getPrompt: (id) => {
    const params = new URLSearchParams({ device_id: getDeviceId() });
    return request(`/prompts/${id}?${params.toString()}`);
  },

  updatePrompt: (id, generatedPrompt) => {
    const params = new URLSearchParams({ device_id: getDeviceId() });
    return request(`/prompts/${id}?${params.toString()}`, {
      method: 'PUT',
      body: JSON.stringify({ generated_prompt: generatedPrompt })
    });
  },

  toggleSavePrompt: (id, isSaved = null) => {
    const params = new URLSearchParams({ device_id: getDeviceId() });
    return request(`/prompts/${id}/save?${params.toString()}`, {
      method: 'PATCH',
      body: JSON.stringify(isSaved !== null ? { is_saved: isSaved } : {})
    });
  },

  deletePrompt: (id) => {
    const params = new URLSearchParams({ device_id: getDeviceId() });
    return request(`/prompts/${id}?${params.toString()}`, {
      method: 'DELETE'
    });
  },

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
