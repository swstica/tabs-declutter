import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossUserDataAccess } from "gadget-server/auth";

export const run: ActionRun = async ({ params, record, logger, api, connections, session }) => {
  applyParams(params, record);
  
  // Auto-assign user from session or API key context
  if (!record.userId) {
    const currentSession = await api.currentSession.get();
    if (currentSession?.userId) {
      record.userId = currentSession.userId;
    } else if (session?.get("user")) {
      const userLink = session.get("user");
      record.userId = userLink?._link || userLink?.id;
    } else if (connections?.currentUser?.id) {
      // Try to get user from connections (for API key auth)
      record.userId = connections.currentUser.id;
    }
  }
  
  // Validate that user is set (required field)
  if (!record.userId) {
    logger.error("Cannot create declutterSession: user not found in session or API key context");
    throw new Error("User authentication required. Please ensure your API key is valid and associated with a user.");
  }
  
  await preventCrossUserDataAccess(params, record);
  await save(record);
};

export const options: ActionOptions = {
  actionType: "create",
};
