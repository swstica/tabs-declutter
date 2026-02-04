import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "declutterSession" model, go to https://tabs-declutter-test.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "U6FtuH6PTFJD",
  comment:
    "Represents a user's tab decluttering session, tracking progress and status.",
  fields: {
    capturedAt: {
      type: "dateTime",
      includeTime: true,
      validations: { required: true },
      storageKey: "d_oKiLQAd3r6",
    },
    completedAt: {
      type: "dateTime",
      includeTime: true,
      storageKey: "skeB0PzD9lJX",
    },
    processedTabs: {
      type: "number",
      default: 0,
      decimals: 0,
      storageKey: "MYolcUxiucuE",
    },
    startedAt: {
      type: "dateTime",
      includeTime: true,
      validations: { required: true },
      storageKey: "yAyv5nk4CTD8",
    },
    status: {
      type: "enum",
      default: "active",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["active", "completed", "abandoned"],
      validations: { required: true },
      storageKey: "YR_xBOaLJ3RT",
    },
    tabCount: {
      type: "number",
      decimals: 0,
      validations: { required: true },
      storageKey: "D5wP5vy7jgOJ",
    },
    totalTabs: {
      type: "number",
      default: 0,
      decimals: 0,
      storageKey: "_kHrNbc-FD8L",
    },
    user: {
      type: "belongsTo",
      parent: { model: "user" },
      storageKey: "cVj6RmFKpoIR",
    },
  },
};
