// Background service worker for Tabs Declutter extension

// Import API client (will be loaded as a module)
import { getApiClient } from './api-client.js';

/**
 * Check if a URL is valid for capture (excludes internal browser pages)
 * Compatible with Chrome, Edge, Brave, and other Chromium-based browsers
 */
function isValidTabUrl(url) {
  if (!url) return false;
  
  // Filter out internal browser pages from all Chromium-based browsers
  const invalidProtocols = [
    'chrome://',           // Chrome
    'edge://',             // Edge
    'brave://',            // Brave
    'about:',              // Generic about pages
    'chrome-extension://', // Extension pages
    'moz-extension://',    // Firefox extensions (if using WebExtensions)
    'vivaldi://',          // Vivaldi
    'opera://'             // Opera
  ];
  
  return !invalidProtocols.some(protocol => url.startsWith(protocol));
}

/**
 * Capture all open tabs and send to backend
 */
async function captureAllTabs() {
  try {
    // Get all open tabs
    const tabs = await chrome.tabs.query({});
    
    // Extract URL and title for each tab
    const tabData = tabs
      .filter(tab => isValidTabUrl(tab.url))
      .map(tab => ({
        url: tab.url,
        title: tab.title || 'Untitled'
      }));

    if (tabData.length === 0) {
      return { success: false, error: 'No valid tabs to capture' };
    }

    // Get API client and call single capture endpoint
    const api = await getApiClient();
    const result = await api.captureTabs(tabData);

    if (!result.success) {
      return {
        success: false,
        error: result.message || result.error || 'Failed to capture tabs'
      };
    }

    const count = result.tabsCaptured ?? (result.tabs?.length ?? 0);
    await chrome.storage.local.set({
      lastCaptureAt: new Date().toISOString(),
      lastCaptureCount: count
    });

    return {
      success: true,
      tabsCaptured: count,
      data: result,
      errors: result.errors
    };
  } catch (error) {
    console.error('Error capturing tabs:', error);
    return {
      success: false,
      error: error.message || 'Failed to capture tabs'
    };
  }
}

/**
 * Capture only the current active tab
 */
async function captureCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !isValidTabUrl(tab.url)) {
      return { success: false, error: 'Cannot capture this tab' };
    }

    const tabData = [{ url: tab.url, title: tab.title || 'Untitled' }];

    // Get API client and call single capture endpoint
    const api = await getApiClient();
    const result = await api.captureTabs(tabData);

    if (!result.success) {
      return {
        success: false,
        error: result.message || result.error || 'Failed to capture tab'
      };
    }

    return {
      success: true,
      tabsCaptured: result.tabsCaptured ?? 1,
      data: result
    };
  } catch (error) {
    console.error('Error capturing current tab:', error);
    return {
      success: false,
      error: error.message || 'Failed to capture tab'
    };
  }
}

/**
 * Get tab count
 */
async function getTabCount() {
  const tabs = await chrome.tabs.query({});
  return tabs.filter(tab => isValidTabUrl(tab.url)).length;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureAll') {
    captureAllTabs().then(result => sendResponse(result));
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'captureCurrent') {
    captureCurrentTab().then(result => sendResponse(result));
    return true;
  }
  
  if (request.action === 'getTabCount') {
    getTabCount().then(count => sendResponse({ count }));
    return true;
  }
  
  if (request.action === 'getLastCapture') {
    chrome.storage.local.get(['lastCaptureAt', 'lastCaptureCount']).then(result => {
      sendResponse({
        lastCaptureAt: result.lastCaptureAt,
        lastCaptureCount: result.lastCaptureCount
      });
    });
    return true;
  }
});
