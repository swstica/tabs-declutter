# ChatGPT App Integration Guide

## Overview

Your tabs declutter system is now fully integrated into the ChatGPT app! Here's what has been set up:

## What's Been Integrated

### 1. **TabManager Component** (`web/chatgpt/TabManager.tsx`)
   - Displays all your captured tab sessions
   - Shows tabs organized by status (unread, keep, read, delete)
   - Allows you to update tab status directly from ChatGPT
   - Beautiful UI using OpenAI's design system

### 2. **MCP Server Tool** (`api/mcp.ts`)
   - Registered `manageTabs` tool that ChatGPT can call
   - Automatically displays your tab sessions when invoked
   - Provides summary statistics about your tabs

### 3. **Widget Registration**
   - The TabManager widget is automatically discovered and registered
   - Accessible in ChatGPT when the tool is invoked

## How It Works

### Flow:
1. **Browser Extension** → Captures tabs → Sends to **Backend API**
2. **Backend API** → Stores tabs in database (declutterSession + tabItem models)
3. **ChatGPT App** → Fetches and displays tabs using Gadget React hooks
4. **User** → Interacts with tabs in ChatGPT → Updates status → Saved to database

### Data Flow:
```
Browser Extension (background.js)
  ↓ POST /api/declutterSessions
  ↓ POST /api/tabItems
Backend (Gadget API)
  ↓ Stores in database
ChatGPT App (TabManager.tsx)
  ↓ useFindMany(api.declutterSession)
  ↓ useFindMany(api.tabItem)
  ↓ useUpdate(api.tabItem)
Displays & Updates tabs
```

## Using in ChatGPT

### Option 1: Direct Tool Invocation
ChatGPT will automatically call the `manageTabs` tool when you ask things like:
- "Show me my tabs"
- "What tabs do I have?"
- "Manage my browser tabs"
- "Review my tab sessions"

### Option 2: Widget Access
The widget is registered as `HelloGadget.html` (based on the file name) and will be displayed when the tool is invoked.

## Features

### Tab Management
- ✅ View all tab sessions
- ✅ See tabs organized by status
- ✅ Mark tabs as: Keep, Read, Delete
- ✅ Restore deleted tabs
- ✅ View tab details (title, URL, domain)
- ✅ Click URLs to open in browser

### Session Management
- ✅ View session status (active, completed, abandoned)
- ✅ See total tabs and processed count
- ✅ Filter by session

## File Structure

```
tabs-declutter-test/
├── web/
│   └── chatgpt/
│       ├── TabManager.tsx      # Main tab management UI
│       ├── HelloGadget.tsx     # Re-exports TabManager
│       ├── root.tsx            # Root provider
│       └── chatgpt.css         # Styles
├── api/
│   └── mcp.ts                  # MCP server with manageTabs tool
└── api/models/
    ├── declutterSession/       # Session model
    └── tabItem/                # Tab model
```

## Testing the Integration

### 1. Capture Some Tabs
1. Install the browser extension
2. Configure API URL and key in extension settings
3. Click "Capture All Tabs" in the extension popup
4. Tabs should be saved to the database

### 2. View in ChatGPT
1. Open ChatGPT
2. Ask: "Show me my browser tabs" or "Manage my tabs"
3. The TabManager widget should appear
4. You should see your captured sessions and tabs

### 3. Update Tab Status
1. In the ChatGPT widget, click "Keep", "Read", or "Delete" on any tab
2. The status should update immediately
3. Refresh to verify the change persisted

## Troubleshooting

### Widget Not Showing
- Check that you're signed in to the ChatGPT app
- Verify the MCP server is running
- Check browser console for errors

### No Tabs Appearing
- Verify tabs were captured via the extension
- Check that you're using the same user account
- Verify API URL and key are correct in extension settings

### Status Updates Not Working
- Check network tab for API errors
- Verify user permissions in access control
- Check that the tab belongs to the current user

## Next Steps

### Enhancements You Could Add:
1. **AI-Powered Tab Organization**
   - Add effects to automatically categorize tabs
   - Use AI to suggest which tabs to keep/delete

2. **Bulk Actions**
   - Select multiple tabs and update status at once
   - Archive entire sessions

3. **Search & Filter**
   - Search tabs by title or URL
   - Filter by domain or date

4. **Analytics**
   - Show tab statistics
   - Track decluttering progress

5. **Export**
   - Export tabs to markdown or CSV
   - Share sessions with others

## API Endpoints Used

- `GET /api/declutterSessions` - List sessions
- `GET /api/tabItems` - List tabs
- `PATCH /api/tabItems/:id` - Update tab status

All endpoints require authentication and respect user-based access control.

