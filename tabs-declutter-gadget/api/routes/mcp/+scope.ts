import { Server } from "gadget-server";

/**
 * Route plugin for mcp/*
 *
 * @see https://www.fastify.dev/docs/latest/Reference/Server
 *
 */
export default async function (server: Server) {
  server.setScopeCORS({
    origin: true,
  });
}