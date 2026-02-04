import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "tabItem" model, go to https://tabs-declutter-test.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "63XaFN9j51qQ",
  comment:
    "Stores information about individual browser tabs, including their URL, title, and status.",
  fields: {
    capturedAt: {
      type: "dateTime",
      includeTime: true,
      validations: { required: true },
      storageKey: "_9qNH6bDDMtI",
    },
    declutterSession: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "declutterSession" },
      storageKey: "aekXWKFFZxne",
    },
    favicon: {
      type: "url",
      storageKey: "2oZWqcczzt03",
      searchIndex: false,
    },
    position: {
      type: "number",
      decimals: 0,
      storageKey: "F6qVbEbjLadD",
      searchIndex: false,
    },
    processedAt: {
      type: "dateTime",
      includeTime: true,
      storageKey: "FHKjpan7WQ2u",
      searchIndex: false,
    },
    session: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "declutterSession" },
      storageKey: "lSx3eaZ4DJgg",
    },
    status: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["unread", "keep", "read", "delete"],
      validations: { required: true },
      storageKey: "pkrlgwjFOfzm",
    },
    title: {
      type: "string",
      validations: { required: true },
      storageKey: "ULImE5vrPQF1",
    },
    url: {
      type: "url",
      validations: { required: true },
      storageKey: "jEODPs6N45IA",
    },
    user: {
      type: "belongsTo",
      parent: { model: "user" },
      storageKey: "jaox9ibIjdcc",
    },
  },
};
