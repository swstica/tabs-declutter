# Tabs Declutter - Design Document

## Overview

Tabs Declutter is a production-ready app that helps users manage their browser tabs through AI-powered organization and a ChatGPT interface.

**Architecture:**
- **Browser Extension**: Captures tab data (URL + title)
- **Gadget.dev Backend**: Stores data, processes with AI, exposes REST APIs
- **ChatGPT In-App Experience**: Primary UI for viewing, querying, and managing tabs

---

## 1. Data Models

### Core Models

#### User
Represents the authenticated user of the application.

```
Fields:
- id: string (auto-generated)
- email: string (unique, required)
- name: string (optional)
- createdAt: datetime (auto-generated)
- updatedAt: datetime (auto-generated)
- lastActiveAt: datetime (optional, for analytics)
```

#### Tab
Represents a single browser tab captured by the extension.

```
Fields:
- id: string (auto-generated)
- userId: string (foreign key → User, required)
- url: string (required, indexed)
- title: string (required)
- domain: string (computed from URL, indexed for filtering)
- capturedAt: datetime (auto-generated)
- isRead: boolean (default: false, indexed)
- isArchived: boolean (default: false, indexed)
- isDeleted: boolean (default: false, soft delete)
  
AI-Processed Fields:
- summary: string (nullable, AI-generated)
- category: string (nullable, AI-generated, e.g., "News", "Tech", "Entertainment", "Education", "Work", "Shopping", "Social", "Other")
- priority: integer (nullable, 1-5, AI-generated)
- tags: array<string> (nullable, AI-generated keywords)
- processedAt: datetime (nullable, when AI processing completed)
  
Metadata:
- faviconUrl: string (nullable, extracted from page)
- screenshotUrl: string (nullable, optional for future use)
- createdAt: datetime (auto-generated)
- updatedAt: datetime (auto-generated)
```

**Relationships:**
- `User` has many `Tabs`
- `Tab` belongs to one `User`

#### Collection
Represents a group of tabs organized by the user or AI.

```
Fields:
- id: string (auto-generated)
- userId: string (foreign key → User, required)
- name: string (required)
- description: string (nullable)
- type: enum ("user_created", "ai_suggested", "auto_category")
- createdAt: datetime (auto-generated)
- updatedAt: datetime (auto-generated)
```

**Relationships:**
- `User` has many `Collections`
- `Collection` belongs to one `User`
- `Collection` has many `Tabs` through `CollectionTab`

#### CollectionTab
Join table for many-to-many relationship between Collections and Tabs.

```
Fields:
- id: string (auto-generated)
- collectionId: string (foreign key → Collection, required)
- tabId: string (foreign key → Tab, required)
- addedAt: datetime (auto-generated)
- order: integer (nullable, for custom ordering)
```

**Relationships:**
- `CollectionTab` belongs to one `Collection`
- `CollectionTab` belongs to one `Tab`

#### TabProcessingJob
Tracks AI processing jobs for tabs (optional, for monitoring/retry logic).

```
Fields:
- id: string (auto-generated)
- tabId: string (foreign key → Tab, required)
- status: enum ("pending", "processing", "completed", "failed")
- errorMessage: string (nullable)
- startedAt: datetime (nullable)
- completedAt: datetime (nullable)
- createdAt: datetime (auto-generated)
```

---

## 2. API Contracts

### Authentication
All endpoints require authentication via API key or session token (handled by Gadget.dev).

### Base URL
```
https://[your-app].gadget.app/api/v1
```

### Endpoints

#### Tabs API

**POST /tabs**
Capture a new tab or batch of tabs.

Request:
```json
{
  "tabs": [
    {
      "url": "https://example.com/article",
      "title": "Example Article Title"
    }
  ]
}
```

Response (201):
```json
{
  "tabs": [
    {
      "id": "tab_123",
      "url": "https://example.com/article",
      "title": "Example Article Title",
      "domain": "example.com",
      "capturedAt": "2024-01-15T10:30:00Z",
      "isRead": false,
      "summary": null,
      "category": null,
      "priority": null,
      "status": "processing"
    }
  ]
}
```

**GET /tabs**
Retrieve tabs for the authenticated user.

Query Parameters:
- `isRead`: boolean (filter by read status)
- `isArchived`: boolean (filter by archived status)
- `category`: string (filter by category)
- `priority`: integer (filter by priority, e.g., `>=3`)
- `domain`: string (filter by domain)
- `limit`: integer (default: 50, max: 100)
- `offset`: integer (default: 0)
- `sortBy`: string ("capturedAt", "priority", "title") (default: "capturedAt")
- `sortOrder`: string ("asc", "desc") (default: "desc")

Response (200):
```json
{
  "tabs": [
    {
      "id": "tab_123",
      "url": "https://example.com/article",
      "title": "Example Article Title",
      "domain": "example.com",
      "capturedAt": "2024-01-15T10:30:00Z",
      "isRead": false,
      "isArchived": false,
      "summary": "A comprehensive article about...",
      "category": "Tech",
      "priority": 4,
      "tags": ["javascript", "web-development"]
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

**GET /tabs/:id**
Retrieve a specific tab.

Response (200):
```json
{
  "id": "tab_123",
  "url": "https://example.com/article",
  "title": "Example Article Title",
  "domain": "example.com",
  "capturedAt": "2024-01-15T10:30:00Z",
  "isRead": false,
  "summary": "A comprehensive article about...",
  "category": "Tech",
  "priority": 4,
  "tags": ["javascript", "web-development"]
}
```

**PATCH /tabs/:id**
Update tab metadata (mark as read, archive, etc.).

Request:
```json
{
  "isRead": true,
  "isArchived": false
}
```

Response (200): Updated tab object

**DELETE /tabs/:id**
Soft delete a tab.

Response (204): No content

**POST /tabs/batch-update**
Batch update multiple tabs.

Request:
```json
{
  "tabIds": ["tab_123", "tab_456"],
  "updates": {
    "isRead": true
  }
}
```

Response (200):
```json
{
  "updated": 2,
  "tabs": [...]
}
```

#### Collections API

**POST /collections**
Create a new collection.

Request:
```json
{
  "name": "Tech Articles",
  "description": "Interesting tech articles to read",
  "type": "user_created"
}
```

Response (201): Collection object

**GET /collections**
Retrieve all collections for the user.

Query Parameters:
- `type`: string (filter by type)
- `includeTabs`: boolean (include tab details, default: false)

Response (200):
```json
{
  "collections": [
    {
      "id": "coll_123",
      "name": "Tech Articles",
      "description": "Interesting tech articles to read",
      "type": "user_created",
      "tabCount": 5,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**GET /collections/:id**
Get a specific collection with its tabs.

Response (200):
```json
{
  "id": "coll_123",
  "name": "Tech Articles",
  "description": "Interesting tech articles to read",
  "type": "user_created",
  "tabs": [
    {
      "id": "tab_123",
      "url": "https://example.com/article",
      "title": "Example Article Title",
      "summary": "...",
      "category": "Tech",
      "priority": 4
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**PATCH /collections/:id**
Update collection details.

**DELETE /collections/:id**
Delete a collection (does not delete tabs).

**POST /collections/:id/tabs**
Add tabs to a collection.

Request:
```json
{
  "tabIds": ["tab_123", "tab_456"]
}
```

Response (200):
```json
{
  "added": 2,
  "collection": {...}
}
```

**DELETE /collections/:id/tabs/:tabId**
Remove a tab from a collection.

#### AI/Query API

**POST /ai/query**
Query tabs using natural language (for ChatGPT interface).

Request:
```json
{
  "query": "What are my unread tabs about JavaScript?",
  "context": {
    "includeRead": false,
    "limit": 10
  }
}
```

Response (200):
```json
{
  "answer": "You have 5 unread tabs about JavaScript: [list with summaries]",
  "tabs": [...],
  "suggestions": {
    "collections": ["JavaScript Learning"],
    "actions": ["mark_as_read", "create_collection"]
  }
}
```

**POST /ai/summarize-collection**
Generate a summary of a collection.

Request:
```json
{
  "collectionId": "coll_123"
}
```

Response (200):
```json
{
  "summary": "This collection contains 5 articles about JavaScript frameworks...",
  "themes": ["React", "Performance", "Best Practices"],
  "estimatedReadTime": "15 minutes"
}
```

**POST /ai/recommend-deletions**
AI suggests which tabs to delete based on criteria.

Request:
```json
{
  "criteria": {
    "olderThan": "30 days",
    "lowPriority": true,
    "alreadyRead": true
  }
}
```

Response (200):
```json
{
  "recommendations": [
    {
      "tabId": "tab_123",
      "reason": "Low priority and older than 30 days",
      "confidence": 0.85
    }
  ],
  "totalSuggested": 12
}
```

---

## 3. Backend Workflows

### Workflow 1: Tab Capture & AI Processing

**Trigger**: POST /tabs endpoint called by browser extension

**Steps:**
1. Validate request (authenticated user, valid URL/title)
2. Create Tab record(s) with `isRead: false`, `summary: null`, `category: null`, `priority: null`
3. Extract domain from URL
4. **Async**: Trigger AI processing job
   - Fetch page content (optional, if needed for better AI analysis)
   - Call AI processing function (see AI Prompt Structure)
   - Update Tab with `summary`, `category`, `priority`, `tags`, `processedAt`
5. Return created tab(s) with status

**Error Handling:**
- Invalid URL → 400 Bad Request
- AI processing failure → Log error, tab remains with null AI fields (can retry later)
- Rate limiting → Queue processing job

### Workflow 2: AI Processing (Background Job)

**Trigger**: After tab creation or manual retry

**Steps:**
1. Create/Update TabProcessingJob with status "processing"
2. Fetch tab URL and title (and optionally page content)
3. Call OpenAI API with structured prompts (see AI Prompt Structure)
4. Parse AI response
5. Update Tab with AI-generated fields
6. Update TabProcessingJob status to "completed"
7. If category matches existing collection, suggest adding to collection

**Retry Logic:**
- On failure, mark job as "failed" with error message
- Implement exponential backoff for retries
- Max 3 retries

### Workflow 3: Query Processing (ChatGPT Interface)

**Trigger**: POST /ai/query from ChatGPT app

**Steps:**
1. Parse natural language query
2. Extract intent (e.g., "show unread tabs", "find tabs about X", "summarize collection")
3. Query database based on intent
4. Format response for ChatGPT display
5. Generate suggestions (collections, actions)
6. Return structured response

**Intent Examples:**
- "What tabs do I have?" → GET /tabs with default filters
- "Show me unread tabs" → GET /tabs?isRead=false
- "What's worth reading?" → GET /tabs?isRead=false&priority>=3&sortBy=priority
- "Tabs about JavaScript" → GET /tabs?tags=javascript (or search in title/summary)
- "Summarize my Tech collection" → POST /ai/summarize-collection

### Workflow 4: Collection Management

**Trigger**: User creates/updates collection via ChatGPT

**Steps:**
1. Validate collection name and type
2. Create/update Collection record
3. If tabs provided, create CollectionTab join records
4. Return collection with tab count

### Workflow 5: Batch Operations

**Trigger**: User performs bulk actions (mark as read, delete, archive)

**Steps:**
1. Validate all tab IDs belong to user
2. Perform batch update/delete
3. Return count of affected records
4. Log action for analytics

---

## 4. AI Prompt Structure

### Prompt 1: Tab Summarization

```
You are analyzing a browser tab to help a user manage their reading list.

Tab Information:
- URL: {url}
- Title: {title}
- Domain: {domain}

Task: Generate a concise, informative summary of what this webpage is about.

Requirements:
- Summary should be 1-2 sentences (max 150 characters)
- Focus on the main topic and value proposition
- Be specific and actionable
- If the title is misleading, clarify what the page actually contains

Output format (JSON):
{
  "summary": "Brief summary text",
  "confidence": 0.0-1.0
}
```

### Prompt 2: Tab Categorization

```
You are categorizing a browser tab to help organize a user's reading list.

Tab Information:
- URL: {url}
- Title: {title}
- Summary: {summary} (if available)

Categories: News, Technology, Entertainment, Education, Work, Shopping, Social, Health, Finance, Travel, Other

Task: Assign the most appropriate category for this tab.

Requirements:
- Choose the single best category
- Consider both the domain and content
- If uncertain, choose "Other"

Output format (JSON):
{
  "category": "Technology",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation"
}
```

### Prompt 3: Tab Prioritization

```
You are prioritizing a browser tab to help a user focus on what matters most.

Tab Information:
- URL: {url}
- Title: {title}
- Summary: {summary} (if available)
- Category: {category} (if available)
- Domain: {domain}

Task: Assign a priority score from 1-5 where:
- 5 = Critical/Urgent (must read soon, time-sensitive, important for work/health)
- 4 = High (valuable content, should read this week)
- 3 = Medium (interesting, read when time permits)
- 2 = Low (nice to have, low urgency)
- 1 = Very Low (probably can skip, low value)

Consider:
- Time sensitivity (news, deadlines, limited-time offers)
- Personal value (educational, work-related, health)
- Content quality indicators (reputable sources, depth)
- User's likely interests based on domain

Output format (JSON):
{
  "priority": 4,
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of priority level"
}
```

### Prompt 4: Tag Extraction

```
Extract 3-5 relevant tags/keywords from this browser tab.

Tab Information:
- URL: {url}
- Title: {title}
- Summary: {summary} (if available)

Requirements:
- Tags should be lowercase, single words or short phrases
- Focus on topics, technologies, concepts
- Avoid generic words like "article", "blog", "website"
- Use hyphens for multi-word tags (e.g., "machine-learning")

Output format (JSON):
{
  "tags": ["javascript", "react", "web-development", "tutorial"],
  "confidence": 0.0-1.0
}
```

### Prompt 5: Combined Processing (Recommended)

For efficiency, combine all AI tasks into a single prompt:

```
You are analyzing a browser tab to help a user manage their reading list.

Tab Information:
- URL: {url}
- Title: {title}
- Domain: {domain}

Tasks:
1. Generate a concise summary (1-2 sentences, max 150 characters)
2. Categorize: News, Technology, Entertainment, Education, Work, Shopping, Social, Health, Finance, Travel, Other
3. Assign priority (1-5): 5=Critical, 4=High, 3=Medium, 2=Low, 1=Very Low
4. Extract 3-5 relevant tags/keywords

Output format (JSON):
{
  "summary": "Brief summary text",
  "category": "Technology",
  "priority": 4,
  "tags": ["javascript", "react", "tutorial"],
  "confidence": 0.0-1.0
}
```

### Prompt 6: Collection Summarization

```
You are summarizing a collection of browser tabs to help a user understand what they've saved.

Collection: {collectionName}
Tabs ({count} total):
{tab_list: title, summary, category, priority for each tab}

Task: Generate a comprehensive summary of this collection.

Requirements:
- Identify common themes and topics
- Highlight the most important/valuable tabs
- Estimate total reading time (assume 2-3 min per tab)
- Suggest if the collection should be split or reorganized
- Be concise but informative (3-4 sentences)

Output format (JSON):
{
  "summary": "This collection contains...",
  "themes": ["theme1", "theme2"],
  "estimatedReadTime": "15 minutes",
  "keyTabs": ["tab_id_1", "tab_id_2"],
  "suggestions": ["suggestion1", "suggestion2"]
}
```

### Prompt 7: Deletion Recommendations

```
You are helping a user declutter their browser tabs by recommending which ones to delete.

User's Tabs:
{tab_list: id, url, title, summary, category, priority, capturedAt, isRead for each tab}

Criteria:
- Older than: {olderThan}
- Low priority: {lowPriority}
- Already read: {alreadyRead}
- Duplicate content: true

Task: Recommend tabs to delete based on the criteria.

Requirements:
- Only recommend deletions with high confidence (>0.7)
- Provide clear reasoning for each recommendation
- Prioritize recommendations (most obvious deletions first)
- Consider duplicates (similar URLs or titles)

Output format (JSON):
{
  "recommendations": [
    {
      "tabId": "tab_123",
      "reason": "Low priority (2), older than 30 days, and already read",
      "confidence": 0.9
    }
  ],
  "totalSuggested": 5,
  "summary": "Found 5 tabs that can be safely deleted..."
}
```

---

## 5. Gadget.dev Setup & Connection

### Initial Setup Steps

1. **Create Gadget App**
   - Go to [gadget.dev](https://gadget.dev)
   - Create a new app (e.g., "tabs-declutter")
   - Choose the appropriate plan

2. **Define Data Models**
   - In Gadget dashboard, go to "Models"
   - Create models as defined in Section 1:
     - User (may already exist if using Gadget auth)
     - Tab
     - Collection
     - CollectionTab
     - TabProcessingJob (optional)
   - Set up relationships and field types
   - Configure indexes on frequently queried fields (isRead, category, priority, domain)

3. **Set Up Authentication**
   - Use Gadget's built-in authentication or API keys
   - For browser extension: API key authentication
   - For ChatGPT app: Session-based auth (Gadget handles this)

4. **Create API Actions**
   - In Gadget, create "Actions" for each endpoint:
     - `createTab` (POST /tabs)
     - `listTabs` (GET /tabs)
     - `getTab` (GET /tabs/:id)
     - `updateTab` (PATCH /tabs/:id)
     - `deleteTab` (DELETE /tabs/:id)
     - `createCollection` (POST /collections)
     - `listCollections` (GET /collections)
     - `queryTabs` (POST /ai/query)
     - `summarizeCollection` (POST /ai/summarize-collection)
     - etc.

5. **Install OpenAI Plugin**
   - In Gadget dashboard, go to "Plugins"
   - Install "OpenAI" plugin
   - Configure with your OpenAI API key
   - This provides a pre-authenticated OpenAI client

6. **Set Up Background Jobs (Optional)**
   - Use Gadget's "Effects" or "Background Jobs" for async AI processing
   - Configure retry logic and error handling

7. **Connect ChatGPT**
   - In Gadget dashboard, go to "Connections"
   - Set up "ChatGPT" connection
   - Configure UI components and actions
   - This enables the in-app ChatGPT experience

### How to Share Gadget Schema with Me

**Option 1: Export Schema (Recommended)**
- In Gadget dashboard, models can be exported
- Share the exported schema file or JSON
- I can review and provide feedback

**Option 2: Screenshots**
- Take screenshots of your model definitions
- Share them so I can see the structure

**Option 3: Gadget API Access**
- If Gadget provides a schema API, share the endpoint
- I can fetch and review the schema

**Option 4: Manual Documentation**
- Create a simple text file listing your models and fields
- I'll review and suggest improvements

### Recommended Development Flow

1. **Phase 1: Core Models**
   - Set up User, Tab, Collection, CollectionTab models
   - Test basic CRUD operations via Gadget's API explorer

2. **Phase 2: Basic APIs**
   - Implement POST /tabs (tab capture)
   - Implement GET /tabs (list tabs)
   - Test with browser extension or Postman

3. **Phase 3: AI Integration**
   - Set up OpenAI plugin
   - Create AI processing action/effect
   - Test with sample tabs

4. **Phase 4: ChatGPT Interface**
   - Connect ChatGPT connection
   - Implement query endpoint
   - Test natural language queries

5. **Phase 5: Advanced Features**
   - Collections management
   - Batch operations
   - Deletion recommendations

---

## 6. Browser Extension Design (Simple)

### Minimal Requirements

**Manifest (manifest.json):**
- Permissions: `tabs`, `storage` (optional, for local caching)
- Background script for tab capture
- Content script not needed (only capturing URLs/titles)

**Core Functionality:**
1. **Capture Tabs**
   - Listen for browser events or user action
   - Get all open tabs: `chrome.tabs.query({})`
   - Extract: `url`, `title` for each tab
   - Send to backend: `POST /tabs` with batch of tabs

2. **Authentication**
   - Store API key in extension storage (encrypted)
   - Include in request headers: `Authorization: Bearer {api_key}`

3. **User Actions**
   - "Capture All Tabs" button
   - Optional: "Capture Current Tab"
   - Optional: Auto-capture on browser close (with user permission)

**No UI Required:**
- Extension can be minimal (just a popup with "Capture" button)
- All interaction happens in ChatGPT interface

---

## 7. ChatGPT App Interface Design

### Key Features

1. **View Unread Tabs**
   - "Show me my unread tabs"
   - Display as cards with title, summary, category, priority
   - Quick actions: Mark as read, Archive, Delete

2. **Query Tabs**
   - "What tabs do I have about JavaScript?"
   - "Show me high-priority tabs"
   - "What's worth reading today?"

3. **Collection Management**
   - "Create a collection called 'Tech Articles'"
   - "Add these tabs to my Tech collection"
   - "Summarize my Tech collection"

4. **AI Recommendations**
   - "What should I read first?"
   - "What can I delete?"
   - "Group similar tabs together"

5. **Bulk Actions**
   - "Mark all Tech tabs as read"
   - "Delete all tabs older than 30 days"
   - "Archive low-priority tabs"

### UI Components (Gadget ChatGPT Connection)

- **Tab Card**: Title, URL, summary, category badge, priority indicator, actions
- **Collection View**: List of tabs in collection, summary, actions
- **Query Results**: List of matching tabs with filters
- **Action Buttons**: Mark as read, Archive, Delete, Add to collection

---

## 8. Security & Performance Considerations

### Security
- API key authentication for browser extension
- User-scoped queries (users can only access their own tabs)
- Input validation (URL format, title length limits)
- Rate limiting on API endpoints
- Sanitize AI-generated content before storing

### Performance
- Index frequently queried fields (isRead, category, priority, domain, capturedAt)
- Pagination on list endpoints (default limit: 50)
- Async AI processing (don't block tab creation)
- Cache collection summaries
- Batch operations for bulk actions

### Error Handling
- Graceful degradation if AI processing fails
- Retry logic for failed AI jobs
- User-friendly error messages
- Logging for debugging

---

## Next Steps

1. **Set up Gadget.dev app** with the models defined above
2. **Share your Gadget schema** so I can review and provide feedback
3. **Implement basic tab capture API** (POST /tabs)
4. **Set up OpenAI integration** and test AI processing
5. **Build browser extension** (simple version first)
6. **Connect ChatGPT interface** and test queries
7. **Iterate and refine** based on usage

Let me know when you have your Gadget models set up, and I can help review the schema and provide specific implementation guidance!



