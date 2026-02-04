/**
 * API Client for Tabs Declutter Extension
 * Centralized API communication with Gadget.dev backend
 */

class ApiClient {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  /**
   * Make an API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.apiUrl}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };

    const config = {
      method: options.method || 'GET',
      headers: { ...defaultHeaders, ...options.headers },
      ...options
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const responseText = await response.text();
      
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : null;
      } catch (e) {
        responseData = { error: responseText || 'Invalid JSON response' };
      }

      if (!response.ok) {
        throw this.createError(response, responseData, responseText);
      }

      return responseData;
    } catch (error) {
      if (error.isApiError) {
        throw error;
      }
      throw new Error(`Network error: ${error.message}`);
    }
  }

  /**
   * Create a standardized error object
   */
  createError(response, errorData, errorText) {
    let message = errorData?.error || errorData?.message;
    
    // Handle Gadget validation errors
    if (errorData?.validationErrors) {
      const validationErrors = Object.entries(errorData.validationErrors)
        .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
        .join('; ');
      message = validationErrors || message;
    }
    
    // Handle errors array
    if (errorData?.errors && Array.isArray(errorData.errors)) {
      const errors = errorData.errors.map(e => {
        if (typeof e === 'string') return e;
        if (e.field && e.message) return `${e.field}: ${e.message}`;
        return e.message || e.field || JSON.stringify(e);
      }).join(', ');
      message = errors || message;
    }

    if (!message) {
      message = `HTTP ${response.status}: ${response.statusText}`;
    }

    const error = new Error(message);
    error.status = response.status;
    error.statusText = response.statusText;
    error.data = errorData;
    error.isApiError = true;
    
    return error;
  }

  /**
   * Capture tabs via custom backend route.
   * Single call: creates session + all tab items with current user from API key.
   */
  async captureTabs(tabDataArray) {
    const tabs = tabDataArray.map((t) => ({
      url: t.url,
      title: t.title || 'Untitled'
    }));
    const url = `${this.apiUrl}/captureTabs`;
    console.log('[Tabs Declutter] POST', url);
    const result = await this.request('/captureTabs', {
      method: 'POST',
      body: { tabs }
    });
    console.log('[Tabs Declutter] Response:', result?.success ? 'OK' : result);
    return result;
  }

  /**
   * Create a declutter session (legacy – prefer captureTabs)
   */
  async createSession(totalTabs = 0) {
    return this.request('/api/declutterSessions', {
      method: 'POST',
      body: {
        declutterSession: {
          startedAt: new Date().toISOString(),
          status: 'active',
          totalTabs: totalTabs
        }
      }
    });
  }

  /**
   * Create a tab item (legacy – prefer captureTabs)
   */
  async createTabItem(tabData, sessionId) {
    return this.request('/api/tabItems', {
      method: 'POST',
      body: {
        tabItem: {
          url: tabData.url,
          title: tabData.title || 'Untitled',
          status: 'unread',
          declutterSessionId: sessionId
        }
      }
    });
  }

  /**
   * Create multiple tab items (legacy – prefer captureTabs)
   */
  async createTabItems(tabDataArray, sessionId) {
    const results = [];
    const errors = [];

    for (const tabData of tabDataArray) {
      try {
        const result = await this.createTabItem(tabData, sessionId);
        results.push(result);
      } catch (error) {
        errors.push({
          tab: tabData,
          error: error.message
        });
      }
    }

    return { results, errors };
  }
}

/**
 * Get API client instance
 */
async function getApiClient() {
  const result = await chrome.storage.sync.get(['apiKey', 'apiUrl']);
  const apiKey = result.apiKey || '';
  const apiUrl = result.apiUrl || '';

  if (!apiKey || !apiUrl) {
    throw new Error('API key or URL not configured. Please set it in extension settings.');
  }

  return new ApiClient(apiUrl, apiKey);
}

// Export for ES6 modules
export { ApiClient, getApiClient };
