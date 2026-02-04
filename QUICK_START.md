# Quick Start Guide - Tabs Declutter

## Getting Started with Gadget.dev

### Step 1: Create Your Gadget App

1. Go to [gadget.dev](https://gadget.dev) and sign up/login
2. Click "New App" → Choose a name (e.g., "tabs-declutter")
3. Select a plan (free tier is fine to start)

### Step 2: Set Up Data Models

In your Gadget dashboard, navigate to **Models** and create:

#### Model: Tab
```
Fields:
- url (String, required)
- title (String, required)
- domain (String, computed/optional)
- capturedAt (DateTime, auto-generated)
- isRead (Boolean, default: false)
- isArchived (Boolean, default: false)
- isDeleted (Boolean, default: false)
- summary (String, optional)
- category (String, optional)
- priority (Number, optional, 1-5)
- tags (JSON/Array, optional)
- processedAt (DateTime, optional)
- faviconUrl (String, optional)
```

**Relationships:**
- `belongsTo User` (Gadget may auto-create User model)

#### Model: Collection
```
Fields:
- name (String, required)
- description (String, optional)
- type (String, enum: "user_created", "ai_suggested", "auto_category")
```

**Relationships:**
- `belongsTo User`
- `hasMany CollectionTab`

#### Model: CollectionTab
```
Fields:
- order (Number, optional)
- addedAt (DateTime, auto-generated)
```

**Relationships:**
- `belongsTo Collection`
- `belongsTo Tab`

### Step 3: Install OpenAI Plugin

1. Go to **Plugins** in Gadget dashboard
2. Find "OpenAI" plugin and install it
3. Add your OpenAI API key in plugin settings
4. This gives you access to `api.openai` in your actions

### Step 4: Create Your First Action

Go to **Actions** → Create new action: `createTab`

**Code Example:**
```javascript
// In Gadget action editor
import { api } from "gadget-server";

export async function run({ params, connections, logger }) {
  const { url, title } = params;
  
  // Extract domain
  const domain = new URL(url).hostname;
  
  // Create tab
  const tab = await api.tab.create({
    url,
    title,
    domain,
    userId: connections.currentUser.id,
    isRead: false
  });
  
  // Trigger async AI processing (see next step)
  // await processTabWithAI(tab.id);
  
  return { tab };
}
```

### Step 5: Set Up AI Processing

Create an **Effect** (or background job) that runs after tab creation:

```javascript
// Effect: After tab.create
import { api, connections } from "gadget-server";

export async function run({ record, logger }) {
  try {
    // Call OpenAI
    const response = await connections.openai.chat.completions.create({
      model: "gpt-4o-mini", // or gpt-3.5-turbo for cost savings
      messages: [{
        role: "system",
        content: "You are analyzing browser tabs..."
      }, {
        role: "user",
        content: `Analyze this tab:\nURL: ${record.url}\nTitle: ${record.title}`
      }],
      response_format: { type: "json_object" }
    });
    
    const analysis = JSON.parse(response.choices[0].message.content);
    
    // Update tab with AI results
    await api.tab.update(record.id, {
      summary: analysis.summary,
      category: analysis.category,
      priority: analysis.priority,
      tags: analysis.tags,
      processedAt: new Date()
    });
  } catch (error) {
    logger.error("AI processing failed", { error, tabId: record.id });
    // Tab remains with null AI fields - can retry later
  }
}
```

### Step 6: Test Your API

1. Go to **API Explorer** in Gadget dashboard
2. Test `createTab` action with:
```json
{
  "url": "https://example.com/article",
  "title": "Example Article"
}
```
3. Check if tab is created and AI processing runs

### Step 7: Connect ChatGPT (Optional - Later)

1. Go to **Connections** → **ChatGPT**
2. Follow Gadget's setup wizard
3. Configure which actions are available to ChatGPT
4. Customize UI components

---

## How to Share Your Gadget Schema

### Option 1: Export from Gadget (If Available)
- Look for "Export" or "Download Schema" option in Models section
- Share the exported file

### Option 2: Manual Documentation
Create a file like `gadget-schema.md` with:
```markdown
# My Gadget Schema

## Tab Model
- url: String (required)
- title: String (required)
- ...

## Collection Model
- name: String (required)
- ...
```

### Option 3: Screenshots
- Take screenshots of your model definitions
- Share them so I can review

### Option 4: API Endpoint
- If Gadget exposes a schema API, share the endpoint
- I can fetch and review

---

## Recommended Development Order

1. ✅ **Set up Gadget app and models** (30 min)
2. ✅ **Create basic `createTab` action** (15 min)
3. ✅ **Test tab creation via API Explorer** (10 min)
4. ✅ **Add OpenAI plugin and AI processing** (30 min)
5. ✅ **Create `listTabs` action with filters** (20 min)
6. ✅ **Build simple browser extension** (1-2 hours)
7. ✅ **Test end-to-end: Extension → Backend → AI** (30 min)
8. ✅ **Set up ChatGPT connection** (1 hour)
9. ✅ **Implement query endpoint** (1 hour)
10. ✅ **Polish and iterate** (ongoing)

---

## Testing Checklist

- [ ] Can create a tab via API
- [ ] Tab appears in database with correct fields
- [ ] AI processing runs and populates summary/category/priority
- [ ] Can list tabs with filters (isRead, category, etc.)
- [ ] Can update tab (mark as read, archive)
- [ ] Browser extension can send tabs to backend
- [ ] ChatGPT can query tabs
- [ ] Collections can be created and tabs added
- [ ] Error handling works (invalid URLs, AI failures)

---

## Getting Help

Once you have your Gadget models set up:
1. Share your schema (using one of the methods above)
2. I can review and suggest improvements
3. Help implement specific actions/workflows
4. Debug any issues

**Next Step:** Set up your Gadget app with the Tab model, then share your schema so I can review it!



