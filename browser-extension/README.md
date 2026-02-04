# Tabs Declutter Browser Extension

A browser extension that captures all open tabs (URL + title) and sends them to the Tabs Declutter backend for AI-powered organization.

## Features

- 📚 **Capture All Tabs**: Capture all open tabs in one click
- 📄 **Capture Current Tab**: Capture just the active tab
- 🔒 **Secure Storage**: API keys stored securely in browser storage
- ⚙️ **Easy Configuration**: Simple settings interface
- 📊 **Status Display**: Shows open tab count and last capture time

## Installation

### For Development

1. **Clone or navigate to this directory**
   ```bash
   cd browser-extension
   ```

2. **Load the extension in your browser**
   - **Chrome**: Navigate to `chrome://extensions/`
   - **Edge**: Navigate to `edge://extensions/`
   - **Brave**: Navigate to `brave://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `browser-extension` directory

3. **Configure the extension**
   - Click the extension icon in your browser toolbar
   - Click "Settings"
   - Enter your Gadget.dev API URL (e.g., `https://your-app.gadget.app`)
   - Enter your Gadget.dev API key
   - Click "Save Settings"

## Usage

1. **Open the extension popup** by clicking the extension icon in your browser toolbar

2. **Capture tabs**:
   - Click "Capture All Tabs" to capture all open tabs
   - Or click "Capture Current Tab" to capture only the active tab

3. **View status**:
   - See how many tabs are currently open
   - Check when tabs were last captured

## Configuration

### API URL
Your Gadget.dev application URL. Example: `https://tabs-declutter.gadget.app`

### API Key
Your Gadget.dev API key. This is stored securely in your browser's sync storage.

**How to get your API key:**
1. Go to your Gadget.dev app dashboard
2. Navigate to Settings → API Keys
3. Create a new API key or use an existing one
4. Copy the key and paste it into the extension settings

## API Endpoint

The extension sends tab data to:
```
POST {API_URL}/api/tabItems
```

**Request Format:**
```json
{
  "tabItem": {
    "url": "https://example.com/article",
    "title": "Example Article Title",
    "status": "unread"
  }
}
```

**Headers:**
```
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

## File Structure

```
browser-extension/
├── manifest.json          # Extension manifest
├── background.js          # Service worker for tab capture
├── popup.html             # Popup UI
├── popup.css              # Popup styles
├── popup.js               # Popup logic
└── icons/                 # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
└── README.md              # This file
```

## Permissions

- **`tabs`**: Required to query and access tab information (URL, title)
- **`storage`**: Used to store API key and settings securely
- **`host_permissions`**: Required to make API requests to your Gadget.dev backend

## Browser Compatibility

- ✅ Chrome (Manifest V3)
- ✅ Edge (Manifest V3)
- ✅ Brave (Manifest V3)
- ✅ Other Chromium-based browsers (Opera, Vivaldi, etc.)

## Development

### Making Changes

1. **Edit files** in the `browser-extension` directory
2. **Reload the extension**:
   - Go to `chrome://extensions/`
   - Find "Tabs Declutter"
   - Click the reload icon (🔄)

### Testing

1. Open multiple tabs in your browser
2. Click the extension icon
3. Click "Capture All Tabs"
4. Check the browser console (F12) for any errors
5. Verify the data was sent to your backend

### Debugging

- **Background script**: Right-click extension icon → "Inspect popup" → Go to "Service Worker" tab
- **Popup script**: Right-click extension icon → "Inspect popup"
- **Console logs**: Check browser console for error messages

## Security Notes

- API keys are stored in `chrome.storage.sync` (encrypted and synced across devices)
- The extension only captures URLs and titles (no page content)
- Internal browser pages (chrome://, edge://, brave://, about:, etc.) are automatically filtered out
- All API requests use HTTPS

## Future Enhancements

- [ ] Auto-capture on browser close (optional)
- [ ] Batch capture with progress indicator
- [ ] Capture specific windows only
- [ ] Filter tabs by domain before capturing
- [ ] Offline queue for failed captures
- [ ] Visual feedback during capture
- [ ] Export/import settings

## Troubleshooting

### "API key or URL not configured"
- Make sure you've entered both API URL and API Key in settings
- Check that the API URL is correct (should start with `https://`)

### "Failed to capture tabs"
- Check your internet connection
- Verify your API key is valid
- Ensure your backend API endpoint is accessible
- Check browser console for detailed error messages

### Extension not loading
- Make sure you're using a Chromium-based browser (Chrome, Edge, Brave, etc.)
- Check that "Developer mode" is enabled
- Verify all files are in the correct directory structure
- For Brave: Navigate to `brave://extensions/` to manage extensions

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify your API configuration
3. Test the backend API endpoint directly (using Postman or curl)

## License

Part of the Tabs Declutter project.

