import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "user" model, go to https://tabs-declutter-test.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "DataModel-AppAuth-User",
  fields: {
    declutterSessions: {
      type: "hasMany",
      children: { model: "declutterSession", belongsToField: "user" },
      storageKey: "REVmIe6QNgNW",
    },
    email: {
      type: "email",
      validations: { required: true, unique: true },
      storageKey: "7NeR3MR_nkcp",
    },
    emailVerificationToken: {
      type: "string",
      storageKey: "gQMBDy84FboV",
    },
    emailVerificationTokenExpiration: {
      type: "dateTime",
      includeTime: true,
      storageKey: "CpzRLHoCZbH9",
    },
    emailVerified: {
      type: "boolean",
      default: false,
      storageKey: "PSkdDOi0WJzs",
    },
    firstName: { type: "string", storageKey: "FCkUrLa0-6ZA" },
    googleImageUrl: { type: "url", storageKey: "dVzwf3Dl5sEd" },
    googleProfileId: { type: "string", storageKey: "JAYBRMB75ET3" },
    lastName: { type: "string", storageKey: "jhFJQKVKIxfs" },
    lastSignedIn: {
      type: "dateTime",
      includeTime: true,
      storageKey: "Ga115BTyFabT",
    },
    password: {
      type: "password",
      validations: { strongPassword: true },
      storageKey: "6hqukNTjw86R",
    },
    profilePicture: {
      type: "file",
      allowPublicAccess: true,
      storageKey: "Hhr1zIce6Ohy",
    },
    resetPasswordToken: {
      type: "string",
      storageKey: "xd6wXVSibgBC",
    },
    resetPasswordTokenExpiration: {
      type: "dateTime",
      includeTime: true,
      storageKey: "rpFWDmUFRbqg",
    },
    roles: {
      type: "roleList",
      default: ["unauthenticated"],
      storageKey: "FHbHCUWfN6iD",
    },
    tabItems: {
      type: "hasMany",
      children: { model: "tabItem", belongsToField: "user" },
      storageKey: "8hZEhvahXDha",
    },
  },
};
