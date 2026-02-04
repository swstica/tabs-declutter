# Troubleshooting: "Unprocessable Entity" Error

## Problem

You're getting a **422 Unprocessable Entity** error when trying to create a `declutterSession` from the browser extension. This error means the server understood the request but couldn't process it due to validation issues.

## Root Cause

The issue is that **the `user` field is required** but isn't being set automatically when using API key authentication. The create action tries to auto-assign the user, but if the API key isn't associated with a user, it fails.

## Solutions

### Solution 1: Use User-Specific API Key (Recommended)

Gadget supports two types of API keys:
1. **App-level API keys** - Not associated with a user (won't work for this)
2. **User-specific API keys** - Associated with a specific user (this is what you need)

**Steps:**
1. Go to your Gadget dashboard: https://tabs-declutter-test.gadget.app
2. Navigate to **Settings** → **API Keys** (or **Authentication** → **API Keys`)
3. Create a **new API key** and make sure it's associated with a user
4. Use this API key in your browser extension

**How to verify:**
- The API key should show which user it's associated with
- When you use it, `connections.currentUser` should be populated

### Solution 2: Use Session-Based Authentication

Instead of API keys, use session-based authentication:

1. **In your browser extension**, first authenticate the user:
```javascript
// First, sign in to get a session
const signInResponse = await fetch(`${config.apiUrl}/api/users/signIn`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user: {
      email: 'user@example.com',
      password: 'password'
    }
  })
});

// Get the session cookie/token from the response
// Then use it for subsequent requests
```

2. **Use the session token** instead of API key:
```javascript
const response = await fetch(`${config.apiUrl}/api/declutterSessions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': sessionCookie // or use the session token
  },
  body: JSON.stringify({...})
});
```

**Note:** This requires users to sign in through the extension, which might not be ideal for a browser extension.

### Solution 3: Pass User ID Explicitly (If You Know It)

If you know the user ID, you can pass it explicitly:

```javascript
// In background.js, update the request:
body: JSON.stringify({
  declutterSession: {
    startedAt: new Date().toISOString(),
    status: 'active',
    totalTabs: tabData.length,
    userId: 'user-id-here' // Add this if you know the user ID
  }
})
```

**But this is not recommended** because:
- You'd need to store the user ID in the extension
- It bypasses security checks
- The `preventCrossUserDataAccess` function should handle this automatically

### Solution 4: Check API Key Format

Make sure your API key is in the correct format:

```javascript
// Correct format
'Authorization': `Bearer ${config.apiKey}`

// Make sure config.apiKey doesn't include "Bearer " prefix
// It should just be the key itself
```

## Debugging Steps

### 1. Check the Full Error Response

Update your error logging to see the full response:

```javascript
if (!sessionResponse.ok) {
  const errorText = await sessionResponse.text();
  console.error('Full error response:', {
    status: sessionResponse.status,
    statusText: sessionResponse.statusText,
    headers: Object.fromEntries(sessionResponse.headers.entries()),
    body: errorText
  });
  // ... rest of error handling
}
```

### 2. Test API Key in Gadget Dashboard

1. Go to your Gadget dashboard
2. Use the **API Explorer** to test creating a `declutterSession`
3. Check if it works with your API key
4. This will help identify if it's an API key issue or a code issue

### 3. Check Gadget Logs

1. Go to your Gadget dashboard
2. Navigate to **Logs** or **Activity**
3. Look for the failed request
4. Check what error message Gadget is returning

### 4. Verify API Key Permissions

Make sure your API key has permission to:
- Create `declutterSession` records
- Create `tabItem` records
- Access the user context

## Updated Create Action

I've updated both create actions to:
1. Try to get user from `connections.currentUser` (for API key auth)
2. Provide a clearer error message if user can't be found
3. Validate that user is set before saving

The updated code is in:
- `/api/models/declutterSession/actions/create.ts`
- `/api/models/tabItem/actions/create.ts`

## Most Likely Fix

**The most likely issue is that you're using an app-level API key instead of a user-specific one.**

To fix:
1. Create a user account in your Gadget app (if you haven't already)
2. Generate a user-specific API key for that user
3. Use that API key in your browser extension

## Testing

After applying the fix, test by:

1. **Clear extension errors** in the browser
2. **Try capturing tabs again**
3. **Check the console** for any new error messages
4. **Verify in Gadget dashboard** that the session was created

If it still fails, check the Gadget logs to see the exact validation error.
