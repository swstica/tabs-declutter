import type { RouteHandler } from "gadget-server";

/**
 * Custom route: POST /captureTabs
 * Accepts tabs from the browser extension and creates session + tabItems
 * with the current user from API key context. Bypasses model validation
 * by setting userId server-side.
 */
const route: RouteHandler<{
  Body: { tabs: Array<{ url: string; title?: string }> };
}> = async ({ request, reply, api, logger }) => {
  const body = request.body;
  if (!body?.tabs || !Array.isArray(body.tabs) || body.tabs.length === 0) {
    return reply.code(400).send({
      error: "Bad request",
      message: "Request body must include a non-empty 'tabs' array with { url, title? } objects.",
    });
  }

  // Get current user from API key / session context
  let userId: string | undefined;

  try {
    const currentSession = await api.currentSession.get();
    userId = currentSession?.userId;
  } catch (e) {
    // Session might not exist for API key requests
    logger.info("No current session found, will try to find a user");
  }

  // If no user from session, get the first user from the database
  // This allows API key access for single-user or development scenarios
  if (!userId) {
    logger.info("captureTabs: No user in session - looking up first user");
    const users = await api.user.findMany({ first: 1 });
    if (users && users.length > 0) {
      userId = users[0].id;
      logger.info({ userId }, "Using first user from database");
    }
  }

  if (!userId) {
    logger.warn("captureTabs: No users found in database");
    return reply.code(401).send({
      error: "Unauthorized",
      message:
        "No user found. Please sign up at least one user in the app first.",
    });
  }

  try {
    // Create declutter session with userId
    const now = new Date().toISOString();
    const sessionRecord = await api.declutterSession.create({
      startedAt: now,
      capturedAt: now,
      status: "active",
      totalTabs: body.tabs.length,
      tabCount: body.tabs.length,
      user: { _link: userId },
    });

    const sessionId = sessionRecord?.id;
    if (!sessionId) {
      throw new Error("Failed to create session - no ID returned");
    }

    const created = [];
    const errors: Array<{ url: string; error: string }> = [];

    for (const tab of body.tabs) {
      const url = tab?.url;
      const title = tab?.title ?? "Untitled";
      if (!url || typeof url !== "string") {
        errors.push({ url: String(url), error: "Missing or invalid url" });
        continue;
      }
      try {
        const tabRecord = await api.tabItem.create({
          url,
          title,
          status: "unread",
          capturedAt: now,
          declutterSession: { _link: sessionId },
          session: { _link: sessionId },
          user: { _link: userId },
        });
        created.push(tabRecord);
      } catch (err: any) {
        errors.push({ url, error: err?.message ?? "Failed to create tab" });
      }
    }

    return reply.code(200).send({
      success: true,
      sessionId,
      tabsCaptured: created.length,
      tabs: created,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    logger.error({ err }, "captureTabs failed");
    return reply.code(500).send({
      error: "Internal server error",
      message: err?.message ?? "Failed to capture tabs",
    });
  }
};

export default route;
