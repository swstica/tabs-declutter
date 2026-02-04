import { RouteHandler } from "gadget-server";
import { createMCPServer } from "../../mcp";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

/**
 * Route handler for POST /mcp
 *
 * See: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 *
 */
const route: RouteHandler<{ Querystring: { sessionId: string } }> = async ({
  request,
  reply,
  api,
  logger,
  connections,
}) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // run in the stateless mode that doesn't need persistent sessions
    enableJsonResponse: true,
  });
  const server = await createMCPServer(request);

  // Take control of the response to prevent Fastify from sending its own response
  // after the MCP transport has already sent one
  reply.hijack();

  try {
    await server.connect(transport);
    await transport.handleRequest(request.raw, reply.raw, request.body);
  } catch (error) {
    console.error("Failed to start StreamableHTTPServerTransport session", error);
    if (!reply.raw.headersSent) {
      reply.raw.writeHead(500).end("Failed to establish StreamableHTTPServerTransport connection");
    }
  }
};

export default route;