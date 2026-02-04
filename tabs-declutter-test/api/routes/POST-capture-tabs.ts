import { RouteHandler } from "gadget-server";

interface TabData {
  title: string;
  url: string;
  favIconUrl?: string;
}

interface CaptureTabsBody {
  tabs: TabData[];
}

const route: RouteHandler<{ Body: CaptureTabsBody }> = async ({ 
  request, 
  reply, 
  api, 
  logger,
  applicationSession,
  applicationSessionID
}) => {
  try {
    // Verify authentication
    if (!applicationSession || !applicationSessionID) {
      await reply.code(401).send({ 
        success: false, 
        error: "Authentication required" 
      });
      return;
    }

    const userId = applicationSession.get("user");
    if (!userId) {
      await reply.code(401).send({ 
        success: false, 
        error: "User not found in session" 
      });
      return;
    }

    // Validate request body
    const { tabs } = request.body;
    
    if (!tabs || !Array.isArray(tabs) || tabs.length === 0) {
      await reply.code(400).send({ 
        success: false, 
        error: "Invalid request: tabs array is required and must not be empty" 
      });
      return;
    }

    // Create declutterSession
    const now = new Date();
    const session = await api.declutterSession.create({
      user: { _link: userId },
      startedAt: now,
      capturedAt: now,
      status: "active",
      tabCount: tabs.length,
    });

    // Create tabItem records
    const tabItemPromises = tabs.map((tab, index) => {
      return api.tabItem.create({
        title: tab.title,
        url: tab.url,
        favicon: tab.favIconUrl || null,
        declutterSession: { _link: session.id },
        session: { _link: session.id },
        user: { _link: userId },
        status: "unread",
        capturedAt: now,
        position: index,
      });
    });

    await Promise.all(tabItemPromises);

    // Return success response
    await reply.send({
      success: true,
      sessionId: session.id,
      tabsCount: tabs.length,
    });

  } catch (error) {
    logger.error({ error }, "Error capturing tabs");
    await reply.code(500).send({
      success: false,
      error: "Failed to capture tabs",
    });
  }
};

route.options = {
  cors: {
    origin: true,
    methods: ["POST"],
    credentials: true,
  },
  schema: {
    body: {
      type: "object",
      properties: {
        tabs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              url: { type: "string" },
              favIconUrl: { type: "string" },
            },
            required: ["title", "url"],
          },
        },
      },
      required: ["tabs"],
    },
  },
};

export default route;