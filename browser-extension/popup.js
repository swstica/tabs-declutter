// Popup script for Tabs Declutter extension

// DOM elements - will be set after DOM loads
let captureAllBtn, captureCurrentBtn, settingsBtn;
let tabCountEl, lastCaptureEl, lastCaptureItem;
let messageEl, settingsModal, closeModalBtn;
let saveSettingsBtn, cancelSettingsBtn;
let apiUrlInput, apiKeyInput;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup initialized');
  
  // Get all DOM elements
  captureAllBtn = document.getElementById('captureAllBtn');
  captureCurrentBtn = document.getElementById('captureCurrentBtn');
  settingsBtn = document.getElementById('settingsBtn');
  tabCountEl = document.getElementById('tabCount');
  lastCaptureEl = document.getElementById('lastCapture');
  lastCaptureItem = document.getElementById('lastCaptureItem');
  messageEl = document.getElementById('message');
  settingsModal = document.getElementById('settingsModal');
  closeModalBtn = document.getElementById('closeModalBtn');
  saveSettingsBtn = document.getElementById('saveSettingsBtn');
  cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
  apiUrlInput = document.getElementById('apiUrl');
  apiKeyInput = document.getElementById('apiKey');
  
  // Verify all elements exist
  if (!saveSettingsBtn) {
    console.error('saveSettingsBtn not found!');
    return;
  }
  if (!apiUrlInput) {
    console.error('apiUrlInput not found!');
    return;
  }
  if (!apiKeyInput) {
    console.error('apiKeyInput not found!');
    return;
  }
  
  console.log('All elements found, setting up event listeners');
  
  // Set up all event listeners
  setupEventListeners();
  
  // Load data
  await loadSettings();
  await updateTabCount();
  await updateLastCapture();
  checkApiConfiguration();
  
  console.log('Initialization complete');
});

// Set up all event listeners
function setupEventListeners() {
  // Capture buttons
  captureAllBtn.addEventListener('click', handleCaptureAll);
  captureCurrentBtn.addEventListener('click', handleCaptureCurrent);
  
  // Settings button
  settingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
    loadSettings();
  });
  
  // Modal buttons
  closeModalBtn.addEventListener('click', () => {
    settingsModal.style.display = 'none';
  });
  
  cancelSettingsBtn.addEventListener('click', () => {
    settingsModal.style.display = 'none';
    loadSettings(); // Reset to saved values
  });
  
  // Save settings button - use onclick for better compatibility
  saveSettingsBtn.onclick = (e) => {
    console.log('Save button clicked!');
    e.preventDefault();
    e.stopPropagation();
    saveSettings();
    return false;
  };
  
  // Also add event listener as backup
  saveSettingsBtn.addEventListener('click', (e) => {
    console.log('Save button clicked (addEventListener)!');
    e.preventDefault();
    e.stopPropagation();
    saveSettings();
  });
  
  // Close modal when clicking outside
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.style.display = 'none';
      loadSettings();
    }
  });
  
  // Prevent modal content clicks from closing the modal
  const modalContent = document.querySelector('.modal-content');
  if (modalContent) {
    modalContent.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  
  console.log('Event listeners set up');
}

// Load settings from storage
async function loadSettings() {
  const result = await chrome.storage.sync.get(['apiUrl', 'apiKey']);
  if (result.apiUrl) {
    apiUrlInput.value = result.apiUrl;
  }
  if (result.apiKey) {
    apiKeyInput.value = result.apiKey;
  }
}

// Update tab count display
async function updateTabCount() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getTabCount' });
    if (response && response.count !== undefined) {
      tabCountEl.textContent = response.count;
    }
  } catch (error) {
    console.error('Error getting tab count:', error);
    tabCountEl.textContent = '-';
  }
}

// Update last capture display
async function updateLastCapture() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getLastCapture' });
    if (response && response.lastCaptureAt) {
      const date = new Date(response.lastCaptureAt);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      
      let timeStr;
      if (diffMins < 1) {
        timeStr = 'Just now';
      } else if (diffMins < 60) {
        timeStr = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      } else if (diffMins < 1440) {
        const hours = Math.floor(diffMins / 60);
        timeStr = `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else {
        const days = Math.floor(diffMins / 1440);
        timeStr = `${days} day${days > 1 ? 's' : ''} ago`;
      }
      
      lastCaptureEl.textContent = `${timeStr} (${response.lastCaptureCount} tabs)`;
      lastCaptureItem.style.display = 'flex';
    }
  } catch (error) {
    console.error('Error getting last capture:', error);
  }
}

// Check if API is configured
function checkApiConfiguration() {
  chrome.storage.sync.get(['apiUrl', 'apiKey'], (result) => {
    if (!result.apiUrl || !result.apiKey) {
      showMessage('⚠️ Please configure API settings first', 'info');
      captureAllBtn.disabled = true;
      captureCurrentBtn.disabled = true;
      // Auto-open settings if not configured
      setTimeout(() => {
        settingsModal.style.display = 'flex';
      }, 500);
    } else {
      captureAllBtn.disabled = false;
      captureCurrentBtn.disabled = false;
    }
  });
}

// Show message
function showMessage(text, type = 'info') {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 5000);
}

// Handle capture all tabs
async function handleCaptureAll() {
  captureAllBtn.disabled = true;
  captureAllBtn.textContent = 'Capturing...';
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'captureAll' });
    
    if (response.success) {
      showMessage(`Successfully captured ${response.tabsCaptured} tab${response.tabsCaptured > 1 ? 's' : ''}!`, 'success');
      await updateLastCapture();
    } else {
      showMessage(response.error || 'Failed to capture tabs', 'error');
    }
  } catch (error) {
    showMessage('Error: ' + error.message, 'error');
  } finally {
    captureAllBtn.disabled = false;
    captureAllBtn.innerHTML = '<span class="btn-icon">📚</span> Capture All Tabs';
  }
}

// Handle capture current tab
async function handleCaptureCurrent() {
  captureCurrentBtn.disabled = true;
  captureCurrentBtn.textContent = 'Capturing...';
  
  try {
    const response = await chrome.runtime.sendMessage({ action: 'captureCurrent' });
    
    if (response.success) {
      showMessage('Successfully captured current tab!', 'success');
      await updateLastCapture();
    } else {
      showMessage(response.error || 'Failed to capture tab', 'error');
    }
  } catch (error) {
    showMessage('Error: ' + error.message, 'error');
  } finally {
    captureCurrentBtn.disabled = false;
    captureCurrentBtn.innerHTML = '<span class="btn-icon">📄</span> Capture Current Tab';
  }
}

// Save settings function
async function saveSettings() {
  console.log('saveSettings function called');
  
  const apiUrl = apiUrlInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  
  console.log('API URL:', apiUrl);
  console.log('API Key:', apiKey ? '***' : 'empty');
  
  if (!apiUrl || !apiKey) {
    showMessage('Please fill in both API URL and API Key', 'error');
    return;
  }
  
  // Validate URL format
  try {
    new URL(apiUrl);
  } catch (err) {
    showMessage('Invalid API URL format', 'error');
    return;
  }
  
  try {
    console.log('Saving settings...');
    await chrome.storage.sync.set({ apiUrl, apiKey });
    console.log('Settings saved successfully');
    
    // Verify it was saved
    const saved = await chrome.storage.sync.get(['apiUrl', 'apiKey']);
    console.log('Verified saved:', saved.apiUrl ? 'URL saved' : 'URL not saved');
    
    settingsModal.style.display = 'none';
    showMessage('✅ Settings saved! You can now capture tabs.', 'success');
    checkApiConfiguration();
  } catch (error) {
    console.error('Save settings error:', error);
    showMessage('Failed to save settings: ' + error.message, 'error');
  }
}
