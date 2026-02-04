import { useFindMany, useUpdate, useSession } from "@gadgetinc/react";
import { useDisplayMode, useRequestDisplayMode } from "@gadgetinc/react-chatgpt-apps";
import { Button } from "@openai/apps-sdk-ui/components/Button";
import { Expand } from "@openai/apps-sdk-ui/components/Icon";
import { MemoryRouter, Route, Routes, Link, useParams } from "react-router";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "../api";

const TabManagerRouter = () => {
  const displayMode = useDisplayMode();
  return (
    <div className={`p-6 max-w-4xl mx-auto ${displayMode === "fullscreen" ? "h-screen" : ""}`}>
      <div className="w-full flex mb-4">
        <FullscreenButton />
      </div>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<TabManager />} />
          <Route path="/session/:sessionId" element={<SessionDetail />} />
        </Routes>
      </MemoryRouter>
    </div>
  );
};

function FullscreenButton() {
  const requestDisplayMode = useRequestDisplayMode();
  const displayMode = useDisplayMode();

  if (displayMode === "fullscreen" || !requestDisplayMode) {
    return null;
  }

  return (
    <Button
      color="secondary"
      variant="soft"
      aria-label="Enter fullscreen"
      className="rounded-full size-10 ml-auto"
      onClick={() => requestDisplayMode("fullscreen")}
    >
      <Expand />
    </Button>
  );
}

function TabManager() {
  const session = useSession();
  const [{ data: sessions, fetching, error }] = useFindMany(api.declutterSession, {
    sort: { startedAt: "Descending" },
    filter: {
      user: {
        equals: session?.user?.id,
      },
    },
  });

  if (fetching) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading your tab sessions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading sessions: {error.message}</p>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <h1 className="text-xl font-semibold tracking-tight mb-4">Tabs Declutter</h1>
        <p className="text-muted-foreground mb-4">
          No tab sessions found. Use the browser extension to capture your tabs!
        </p>
        <p className="text-sm text-muted-foreground">
          Install the extension and configure it with your API URL and key to start capturing tabs.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Tabs Declutter</h1>
        <p className="text-muted-foreground text-sm">
          Manage your captured browser tabs and declutter sessions
        </p>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => (
          <Card key={session.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    Session from {new Date(session.startedAt).toLocaleDateString()}
                    <StatusBadge status={session.status} />
                  </CardTitle>
                  <CardDescription>
                    {session.totalTabs} tabs • {session.processedTabs} processed
                    {session.completedAt && ` • Completed ${new Date(session.completedAt).toLocaleDateString()}`}
                  </CardDescription>
                </div>
                <Link to={`/session/${session.id}`}>
                  <Button variant="outline" size="sm">
                    View Tabs
                  </Button>
                </Link>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SessionDetail() {
  const session = useSession();
  const { sessionId } = useParams<{ sessionId: string }>();

  if (!sessionId) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Invalid session ID</p>
        <Link to="/">
          <Button variant="outline" className="mt-4">
            Back to Sessions
          </Button>
        </Link>
      </div>
    );
  }

  const [{ data: sessionData, fetching: sessionFetching }] = useFindMany(api.declutterSession, {
    filter: {
      id: { equals: sessionId },
      user: { equals: session?.user?.id },
    },
    first: 1,
  });

  const [{ data: tabs, fetching: tabsFetching }] = useFindMany(api.tabItem, {
    filter: {
      declutterSession: { equals: sessionId },
      user: { equals: session?.user?.id },
    },
    sort: { createdAt: "Descending" },
  });

  const [, updateTab] = useUpdate(api.tabItem);

  const handleStatusChange = async (tabId: string, newStatus: "keep" | "read" | "delete" | "unread") => {
    try {
      await updateTab(tabId, {
        tabItem: {
          status: newStatus,
          ...(newStatus === "read" || newStatus === "delete" ? { processedAt: new Date().toISOString() } : {}),
        },
      });
    } catch (error) {
      console.error("Error updating tab status:", error);
    }
  };

  if (sessionFetching || tabsFetching) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading session details...</p>
      </div>
    );
  }

  const currentSession = sessionData?.[0];

  if (!currentSession) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Session not found</p>
        <Link to="/">
          <Button variant="outline" className="mt-4">
            Back to Sessions
          </Button>
        </Link>
      </div>
    );
  }

  const unreadTabs = tabs?.filter((t) => t.status === "unread") || [];
  const keepTabs = tabs?.filter((t) => t.status === "keep") || [];
  const readTabs = tabs?.filter((t) => t.status === "read") || [];
  const deleteTabs = tabs?.filter((t) => t.status === "delete") || [];

  return (
    <div>
      <div className="mb-6">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-4">
            ← Back to Sessions
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Session from {new Date(currentSession.startedAt).toLocaleDateString()}
        </h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            <StatusBadge status={currentSession.status} />
          </span>
          <span>{tabs?.length || 0} total tabs</span>
          <span>{currentSession.processedTabs} processed</span>
        </div>
      </div>

      <div className="space-y-6">
        {unreadTabs.length > 0 && (
          <TabSection
            title="Unread Tabs"
            tabs={unreadTabs}
            onStatusChange={handleStatusChange}
            color="default"
          />
        )}

        {keepTabs.length > 0 && (
          <TabSection
            title="Keep"
            tabs={keepTabs}
            onStatusChange={handleStatusChange}
            color="secondary"
          />
        )}

        {readTabs.length > 0 && (
          <TabSection
            title="Read"
            tabs={readTabs}
            onStatusChange={handleStatusChange}
            color="outline"
          />
        )}

        {deleteTabs.length > 0 && (
          <TabSection
            title="Delete"
            tabs={deleteTabs}
            onStatusChange={handleStatusChange}
            color="destructive"
          />
        )}

        {(!tabs || tabs.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            No tabs found in this session
          </div>
        )}
      </div>
    </div>
  );
}

function TabSection({
  title,
  tabs,
  onStatusChange,
  color,
}: {
  title: string;
  tabs: any[];
  onStatusChange: (tabId: string, status: "keep" | "read" | "delete" | "unread") => void;
  color: "default" | "secondary" | "outline" | "destructive";
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        {title}
        <Badge variant={color === "destructive" ? "destructive" : "secondary"}>{tabs.length}</Badge>
      </h2>
      <div className="space-y-2">
        {tabs.map((tab) => (
          <TabItem key={tab.id} tab={tab} onStatusChange={onStatusChange} />
        ))}
      </div>
    </div>
  );
}

function TabItem({
  tab,
  onStatusChange,
}: {
  tab: any;
  onStatusChange: (tabId: string, status: "keep" | "read" | "delete" | "unread") => void;
}) {
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate mb-1">{tab.title}</h3>
          <p className="text-sm text-muted-foreground truncate mb-2">{getDomain(tab.url)}</p>
          <a
            href={tab.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline break-all"
          >
            {tab.url}
          </a>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {tab.status === "unread" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(tab.id, "keep")}
              >
                Keep
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(tab.id, "read")}
              >
                Read
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onStatusChange(tab.id, "delete")}
              >
                Delete
              </Button>
            </>
          )}
          {tab.status === "keep" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(tab.id, "read")}
              >
                Mark Read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(tab.id, "unread")}
              >
                Reset
              </Button>
            </>
          )}
          {tab.status === "read" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(tab.id, "unread")}
            >
              Reset
            </Button>
          )}
          {tab.status === "delete" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(tab.id, "unread")}
            >
              Restore
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "completed"
      ? "default"
      : status === "active"
        ? "secondary"
        : "outline";

  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}

export default TabManagerRouter;

