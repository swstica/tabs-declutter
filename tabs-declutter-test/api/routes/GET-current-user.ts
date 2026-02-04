import { RouteHandler } from "gadget-server";

const route: RouteHandler = async ({ request, reply, api, applicationSession }) => {
  // Check if there is an active session with a user
  if (!applicationSession || !applicationSession.get("user")) {
    await reply.code(401).send({
      error: "Unauthorized",
      message: "No active session found. Please sign in."
    });
    return;
  }

  const userId = applicationSession.get("user");

  try {
    // Fetch the user details
    const user = await api.user.findOne(userId, {
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    if (!user) {
      await reply.code(401).send({
        error: "Unauthorized",
        message: "User not found."
      });
      return;
    }

    // Return user information
    await reply.send({
      id: user.id,
      email: user.email,
      firstName: user.firstName || null,
      lastName: user.lastName || null
    });
  } catch (error) {
    await reply.code(500).send({
      error: "Internal Server Error",
      message: "Failed to fetch user information."
    });
  }
};

// Configure CORS to allow requests from browser extensions
route.options = {
  cors: {
    origin: true, // Allow requests from any origin (needed for browser extensions)
    methods: ["GET"],
    credentials: true // Allow cookies for session authentication
  }
};

export default route;