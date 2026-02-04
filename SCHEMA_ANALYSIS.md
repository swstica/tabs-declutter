# Schema Analysis & Recommendations

## Current Schema Overview

I've reviewed your Gadget schema. Here's what you have:

### Existing Models

#### 1. **tabItem** (Tab Model)
```
Fields:
- url (URL, required)
- title (String, required)
- favicon (URL, optional)
- position (Number, optional)
- status (Enum: "unread", "keep", "read", "delete", required)
- processedAt (DateTime, optional)
- user (belongsTo User, required)
- declutterSession (belongsTo DeclutterSession, required)
```

#### 2. **declutterSession** (Session Model)
```
Fields:
- startedAt (DateTime, required)
- completedAt (DateTime, optional)
- status (Enum: "active", "completed", "abandoned", required, default: "active")
- totalTabs (Number, default: 0)
- processedTabs (Number, default: 0)
- user (belongsTo User, required)
```

#### 3. **user** (Standard Gadget Auth)
- Standard authentication fields
- Has relationships to `tabItems` and `declutterSessions`

#### 4. **session** (Auth Session)
- Standard Gadget session model

---

## Comparison: Current vs. Design

### ✅ What's Already Good

1. **Tab Status System**: Your `status` enum (`unread`, `keep`, `read`, `delete`) is actually cleaner than separate boolean fields
2. **Session Tracking**: `declutterSession` is a smart addition for tracking decluttering workflows
3. **User Relationship**: Proper user scoping is in place
4. **Favicon Support**: Already included

### ❌ Missing Fields for AI Processing

Your `tabItem` model needs these fields for AI functionality:

1. **`summary`** (String, optional) - AI-generated summary
2. **`category`** (String, optional) - AI-generated category
3. **`priority`** (Number, optional, 1-5) - AI-generated priority
4. **`tags`** (JSON/Array, optional) - AI-generated tags
5. **`domain`** (String, optional, indexed) - Computed from URL for filtering

### ❌ Missing Models

1. **`Collection`** - For grouping tabs (user-created or AI-suggested)
2. **`CollectionTab`** - Join table for many-to-many relationship

### 🔄 Design Differences

**Current Approach:**
- Session-based workflow (`declutterSession`)
- Status enum instead of separate booleans
- Tabs belong to a session

**Design Approach:**
- Collection-based organization
- Separate `isRead`, `isArchived`, `isDeleted` booleans
- Tabs can exist independently

**Recommendation:** Keep your session-based approach (it's actually better for workflow tracking), but add the missing AI fields and Collections support.

---

## Recommended Schema Enhancements

### 1. Enhance `tabItem` Model

Add these fields to `/api/models/tabItem/schema.gadget.ts`:

```typescript
// Add to fields object:
summary: {
  type: "string",
  storageKey: "summary_xyz", // Gadget will generate this
  searchIndex: true, // Enable search
},
category: {
  type: "enum",
  options: ["News", "Technology", "Entertainment", "Education", "Work", "Shopping", "Social", "Health", "Finance", "Travel", "Other"],
  acceptMultipleSelections: false,
  acceptUnlistedOptions: false,
  storageKey: "category_xyz",
  searchIndex: true,
},
priority: {
  type: "number",
  decimals: 0,
  validations: { min: 1, max: 5 },
  storageKey: "priority_xyz",
  searchIndex: true,
},
tags: {
  type: "richText", // Or use JSON field type if available
  storageKey: "tags_xyz",
  // Alternative: Use a separate Tag model with many-to-many
},
domain: {
  type: "string",
  storageKey: "domain_xyz",
  searchIndex: true, // Important for filtering
},
```

### 2. Create `Collection` Model

Create `/api/models/collection/schema.gadget.ts`:

```typescript
import type { GadgetModel } from "gadget-server";

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "collection_xyz", // Gadget generates
  comment: "Represents a group of tabs organized by user or AI",
  fields: {
    name: {
      type: "string",
      validations: { required: true },
      storageKey: "name_xyz",
    },
    description: {
      type: "string",
      storageKey: "description_xyz",
    },
    type: {
      type: "enum",
      options: ["user_created", "ai_suggested", "auto_category"],
      default: "user_created",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      storageKey: "type_xyz",
    },
    user: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "user" },
      storageKey: "user_xyz",
    },
  },
};
```

### 3. Create `CollectionTab` Model

Create `/api/models/collectionTab/schema.gadget.ts`:

```typescript
import type { GadgetModel } from "gadget-server";

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "collectionTab_xyz",
  comment: "Join table for many-to-many relationship between Collections and Tabs",
  fields: {
    collection: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "collection" },
      storageKey: "collection_xyz",
    },
    tabItem: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "tabItem" },
      storageKey: "tabItem_xyz",
    },
    order: {
      type: "number",
      decimals: 0,
      storageKey: "order_xyz",
    },
    addedAt: {
      type: "dateTime",
      includeTime: true,
      storageKey: "addedAt_xyz",
    },
  },
};
```

### 4. Make `declutterSession` Optional on `tabItem`

Consider making `declutterSession` optional so tabs can exist independently:

```typescript
declutterSession: {
  type: "belongsTo",
  validations: { required: false }, // Change from true to false
  parent: { model: "declutterSession" },
  storageKey: "aekXWKFFZxne",
},
```

---

## Implementation Priority

### Phase 1: Essential AI Fields (Do First)
1. Add `summary`, `category`, `priority`, `domain` to `tabItem`
2. Create computed field or effect to extract `domain` from `url`
3. Set up OpenAI plugin (if not already done)

### Phase 2: Collections (Do Second)
1. Create `Collection` model
2. Create `CollectionTab` model
3. Add actions for collection management

### Phase 3: Enhanced Features (Do Later)
1. Add `tags` field (or separate Tag model)
2. Make `declutterSession` optional
3. Add indexes for performance

---

## Next Steps

1. **Review this analysis** - Does the session-based approach work for your use case?
2. **Add AI fields** - I can help update the `tabItem` schema
3. **Set up OpenAI integration** - Check if OpenAI plugin is installed
4. **Create Collections** - If you want the collection feature

Would you like me to:
- Update the `tabItem` schema with AI fields?
- Create the `Collection` and `CollectionTab` models?
- Set up the AI processing effects/actions?
- Review your existing actions and suggest improvements?

Let me know what you'd like to tackle first!



