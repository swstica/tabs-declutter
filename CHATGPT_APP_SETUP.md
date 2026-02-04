# ChatGPT App Creation - Field Values Guide

## Required Fields for Creating Your ChatGPT App

### 1. **Icon (Optional)**
- **Status**: Optional
- **Recommendation**: Upload a 128x128px icon representing your tabs declutter app
- **Minimum size**: 128 x 128 px
- You can use the extension icon from `browser-extension/icons/icon128.png` if you want

---

### 2. **Name**
- **Value**: `tabs declutter`
- **Status**: ✅ Pre-filled (correct)
- **Note**: This is already set correctly

---

### 3. **Description (Optional)**
- **Status**: Optional but recommended
- **Recommended Value**: 
  ```
  A tabs declutter app that uses a Browser Extension to gather browser tabs and organize them. View and manage your captured tabs, mark them as keep/read/delete, and declutter your browsing sessions.
  ```
- **Current**: Partially filled - you can complete it with the above

---

### 4. **MCP Server URL** ⚠️ **REQUIRED**
- **Status**: ❌ **MUST BE FILLED** (currently shows error)
- **Format**: `https://{your-app-url}/api/mcp`
- **How to find your app URL**:
  1. Go to your Gadget.dev dashboard
  2. Your app URL is: `https://tabs-declutter-test.gadget.app` (or your custom domain)
  3. The full MCP URL would be: `https://tabs-declutter-test.gadget.app/api/mcp`

- **Example**:
  ```
  https://tabs-declutter-test.gadget.app/api/mcp
  ```

- **Important Notes**:
  - Replace `tabs-declutter-test` with your actual Gadget app name
  - The endpoint `/api/mcp` is correct (it's the POST route we created)
  - Make sure your app is deployed and accessible
  - The MCP server uses Server-Sent Events (SSE) for streaming

---

### 5. **Authentication**
- **Current Selection**: `OAuth` ✅
- **Status**: Correct - Keep this selected
- **Why**: Your Gadget app uses OAuth for ChatGPT authentication (configured in `settings.gadget.ts`)

---

### 6. **OAuth Client ID (Optional)**
- **Status**: Optional
- **When to fill**: Only if you're using a custom OAuth provider
- **For Gadget apps**: Leave this **EMPTY** 
- **Reason**: Gadget handles OAuth internally through the `/authorize` endpoint

---

### 7. **OAuth Client Secret (Optional)**
- **Status**: Optional
- **When to fill**: Only if you're using a custom OAuth provider
- **For Gadget apps**: Leave this **EMPTY**
- **Reason**: Gadget handles OAuth internally

---

### 8. **Consent Checkbox**
- **Status**: ✅ Already checked
- **Action**: Keep it checked
- **Note**: This acknowledges the security warning about custom MCP servers

---

## Complete Field Summary

| Field | Value | Required | Notes |
|-------|-------|----------|-------|
| **Icon** | (Upload 128x128px) | No | Optional, but recommended |
| **Name** | `tabs declutter` | Yes | ✅ Pre-filled correctly |
| **Description** | `A tabs declutter app that uses a Browser Extension to gather browser tabs and organize them. View and manage your captured tabs, mark them as keep/read/delete, and declutter your browsing sessions.` | No | Recommended to complete |
| **MCP Server URL** | `https://tabs-declutter-test.gadget.app/api/mcp` | **YES** | ⚠️ **REPLACE with your actual app URL** |
| **Authentication** | `OAuth` | Yes | ✅ Keep as OAuth |
| **OAuth Client ID** | (Leave empty) | No | Not needed for Gadget |
| **OAuth Client Secret** | (Leave empty) | No | Not needed for Gadget |
| **Consent Checkbox** | ✅ Checked | Yes | ✅ Already checked |

---

## Step-by-Step Instructions

### Step 1: Find Your Gadget App URL
1. Go to [Gadget.dev Dashboard](https://gadget.dev)
2. Open your app: `tabs-declutter-test`
3. Your app URL is shown in the dashboard (usually `https://{app-name}.gadget.app`)
4. Copy this URL

### Step 2: Fill in the MCP Server URL
1. In the ChatGPT app creation modal
2. In the **MCP Server URL** field, enter:
   ```
   https://{your-app-name}.gadget.app/api/mcp
   ```
3. Replace `{your-app-name}` with your actual app name
4. The error "URL is required" should disappear once you enter a valid URL

### Step 3: Complete the Description (Optional)
1. Replace the partial description with the full one provided above
2. This helps users understand what your app does

### Step 4: Verify Settings
- ✅ Name: `tabs declutter`
- ✅ Authentication: `OAuth`
- ✅ OAuth fields: **Leave empty**
- ✅ Consent: **Checked**

### Step 5: Create the App
1. Click **"Create"** button
2. The app should be created successfully
3. You can now use it in ChatGPT!

---

## Verification Checklist

Before clicking "Create", verify:

- [ ] MCP Server URL is filled with your actual Gadget app URL
- [ ] URL format is: `https://{app-name}.gadget.app/api/mcp`
- [ ] Authentication is set to `OAuth`
- [ ] OAuth Client ID and Secret are **empty** (for Gadget apps)
- [ ] Consent checkbox is checked
- [ ] Your Gadget app is deployed and accessible

---

## Testing After Creation

1. **Test the Connection**:
   - In ChatGPT, try: "Show me my browser tabs"
   - The `manageTabs` tool should be invoked
   - The TabManager widget should appear

2. **Verify Authentication**:
   - You may be redirected to `/authorize` for OAuth
   - Sign in with your Gadget account
   - Grant access to ChatGPT

3. **Test Tab Management**:
   - If you have captured tabs, they should appear
   - Try updating a tab status (Keep/Read/Delete)
   - Verify the changes persist

---

## Troubleshooting

### "URL is required" Error
- **Cause**: MCP Server URL field is empty or invalid
- **Fix**: Enter your full Gadget app URL: `https://{app-name}.gadget.app/api/mcp`

### Connection Failed
- **Cause**: App not deployed or URL incorrect
- **Fix**: 
  1. Verify your app is deployed in Gadget
  2. Test the URL in browser: `https://{app-name}.gadget.app/api/mcp`
  3. Check CORS settings (should be enabled in `+scope.ts`)

### OAuth Errors
- **Cause**: OAuth not configured correctly
- **Fix**: 
  1. Verify `settings.gadget.ts` has ChatGPT connection enabled
  2. Check that `/authorize` route exists
  3. Ensure OAuth Client ID/Secret fields are **empty** (Gadget handles this)

### Widget Not Showing
- **Cause**: Widget not registered or MCP server error
- **Fix**:
  1. Check that `TabManager.tsx` exists in `web/chatgpt/`
  2. Verify MCP server is running
  3. Check browser console for errors

---

## Quick Reference

**Your MCP Server URL should be:**
```
https://tabs-declutter-test.gadget.app/api/mcp
```
*(Replace `tabs-declutter-test` with your actual app name)*

**OAuth Settings:**
- Authentication: `OAuth` ✅
- OAuth Client ID: (empty) ✅
- OAuth Client Secret: (empty) ✅

---

## Need Help?

If you encounter issues:
1. Check the [CHATGPT_INTEGRATION.md](./CHATGPT_INTEGRATION.md) guide
2. Verify your Gadget app is running and accessible
3. Check browser console for detailed error messages
4. Ensure all routes are properly deployed

