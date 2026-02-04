# Quick Setup Guide

## Step 1: Load Extension in Browser

1. Open your browser:
   - **Chrome**: Go to `chrome://extensions/`
   - **Edge**: Go to `edge://extensions/`
   - **Brave**: Go to `brave://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `browser-extension` folder

## Step 2: Configure API Settings

1. Click the extension icon in your browser toolbar
2. Click **⚙️ Settings**
3. Enter your **API URL**: `https://your-app.gadget.app`
4. Enter your **API Key** (from Gadget.dev dashboard)
5. Click **Save Settings**

## Step 3: Test the Extension

1. Open a few tabs in your browser
2. Click the extension icon
3. Click **Capture All Tabs**
4. You should see a success message

## Getting Your API Key

1. Go to your Gadget.dev app dashboard
2. Navigate to **Settings** → **API Keys**
3. Create a new API key or copy an existing one
4. Paste it into the extension settings

## API Endpoint Expected

The extension sends data to:
```
POST {API_URL}/api/tabItems
```

With headers:
```
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

And body (for each tab):
```json
{
  "tabItem": {
    "url": "https://example.com",
    "title": "Example Title",
    "status": "unread"
  }
}
```

## Troubleshooting

- **Extension not loading?** Make sure Developer mode is enabled
- **"API key not configured"?** Check your settings in the extension popup
- **Capture failing?** Check browser console (F12) for error messages
- **Backend not receiving data?** Verify your API URL and key are correct

## Next Steps

Once the extension is working:
1. Test capturing tabs
2. Verify data appears in your Gadget.dev backend
3. Check that AI processing runs on captured tabs
4. Integrate with the ChatGPT interface (when ready)

