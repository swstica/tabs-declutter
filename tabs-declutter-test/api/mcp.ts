import { getWidgets } from "vite-plugin-chatgpt-widgets";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FastifyRequest } from "fastify";
import path from "path";
import { getViteHandle } from "gadget-server/vite";

/**
 * Create MCP server to be used by external clients
 *
 */
export const createMCPServer = async (request: FastifyRequest) => {
  const mcpServer = new McpServer({
    name: "example-mcp",
    version: "1.0.0",
  });

  // use actAsSession to access the API client with the permissions of the current session
  const api = request.api.actAsSession;
  const logger = request.logger;

  // get a handle to either the vite dev server in development or the manifest path in production
  const viteHandle = await getViteHandle(request.server);

  // Get the HTML snippet for each widget
  const widgets = await getWidgets("web/chatgpt", viteHandle);

  // Register each widget's HTML snippet as a resource for exposure to ChatGPT
  for (const widget of widgets) {
    const resourceName = `widget-${widget.name.toLowerCase()}`;
    const resourceUri = `ui://widget/${widget.name}.html`;

    mcpServer.registerResource(
      resourceName,
      resourceUri,
      {
        title: widget.name,
        description: `ChatGPT widget for ${widget.name}`,
      },
      async () => {
        return {
          contents: [
            {
              uri: resourceUri,
              mimeType: "text/html+skybridge",
              text: widget.content,
              _meta: getResourceMeta(),
            },
          ],
        };
      }
    );
  }

  // Register the tab management tool
  mcpServer.registerTool(
    "manageTabs",
    {
      title: "Manage Browser Tabs",
      description: "View and manage your captured browser tabs. Use this when the user wants to see their tabs, organize them, mark them as read/keep/delete, or review their tab decluttering sessions.",
      annotations: { readOnlyHint: true },
      _meta: {
        // Tell ChatGPT which widget to render on invocation
        "openai/outputTemplate": "ui://widget/HelloGadget.html",
        // Attach hints for ChatGPT about expected output behavior
        "openai/toolBehavior": "interactive",
      },
    },
    async (params) => {
      const currentUserId = (await api.currentSession.get()).userId;
      
      if (!currentUserId) {
        return {
          structuredContent: { 
            message: "Please sign in to view your tabs.",
            requiresAuth: true 
          },
          content: [],
        };
      }

      // Get user's tab sessions summary
      const sessions = await api.declutterSession.findMany({
        filter: {
          user: { equals: currentUserId },
        },
        sort: { startedAt: "Descending" },
        first: 5,
      });

      const totalSessions = sessions.length;
      const activeSessions = sessions.filter((s) => s.status === "active").length;
      const totalTabs = sessions.reduce((sum, s) => sum + (s.totalTabs || 0), 0);

      return {
        structuredContent: {
          message: `You have ${totalSessions} tab session${totalSessions !== 1 ? "s" : ""} with ${totalTabs} total tabs. ${activeSessions > 0 ? `${activeSessions} session${activeSessions !== 1 ? "s are" : " is"} still active.` : "All sessions are completed."}`,
          sessionsCount: totalSessions,
          activeSessionsCount: activeSessions,
          totalTabsCount: totalTabs,
        },
        content: [],
      };
    }
  );

  // power the @gadgetinc/react-chatgpt-apps Provider to make auth'd requests from widgets using the 'api' client
  mcpServer.registerTool(
    "__getGadgetAuthTokenV1",
    {
      title: "Get the gadget auth token",
      description:
        "Gets the gadget auth token. Should never be called by LLMs or ChatGPT -- only used for internal auth machinery.",
      _meta: {
        // ensure widgets can invoke this tool to get the token
        "openai/widgetAccessible": true,
      },
    },
    async () => {
      if (!request.headers["authorization"]) {
        return {
          structuredContent: { token: null },
          content: [],
        };
      }

      const [scheme, token] = request.headers["authorization"].split(" ", 2);
      if (scheme !== "Bearer") {
        return {
          structuredContent: { error: "incorrect token scheme", token: null },
          content: [],
        };
      }

      return {
        structuredContent: { token, scheme },
        content: [],
      };
    }
  );

  return mcpServer;
};

type ResourceMeta = {
  "openai/widgetPrefersBorder": boolean;
  "openai/widgetDomain": string;
  "openai/widgetCSP"?: {
    connect_domains: string[];
    resource_domains: string[];
  };
};

const getResourceMeta = () => {
  const _meta: ResourceMeta = {
    "openai/widgetPrefersBorder": true,
    "openai/widgetDomain": process.env.GADGET_APP_URL!,
  };

  if (process.env.NODE_ENV == "production") {
    _meta["openai/widgetCSP"] = {
      // Maps to `connect-src` rule in the iframe CSP
      connect_domains: [process.env.GADGET_APP_URL!],
      // Maps to style-src, style-src-elem, img-src, font-src, media-src etc. in the iframe CSP
      resource_domains: [process.env.GADGET_APP_URL!, "https://assets.gadget.dev", "https://app-assets.gadget.dev"],
    };
  }

  return _meta;
};