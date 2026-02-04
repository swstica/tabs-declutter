import { SignInComponent } from "@/components/auth/sign-in";
import { SignUpComponent } from "@/components/auth/sign-up";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCallback, useEffect, useRef, useState } from "react";
import openAILogo from "../assets/openai-logo.svg";
import type { Route } from "./+types/authorize";

export const loader = async ({ context, request }: Route.LoaderArgs) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    throw new Error("Missing required OAuth parameters: code");
  }

  const consentAlreadyGranted = url.searchParams.get("prompt") === "none";

  const { session } = context;
  const userId = session?.get("user");
  const user = userId ? await context.api.user.findOne(userId) : undefined;

  const redirectSearchParams = new URLSearchParams(url.search);
  redirectSearchParams.set("prompt", "none");
  const redirectTo = `${encodeURIComponent(`${url.pathname}?${redirectSearchParams.toString()}`)}`;

  return {
    csrfToken: session?.get("csrfToken"),
    code,
    user,
    consentAlreadyGranted,
    redirectTo,
  };
};

export default function ({ loaderData }: Route.ComponentProps) {
  const { csrfToken, code, consentAlreadyGranted, user, redirectTo } = loaderData;

  if (!user) {
    return <AuthorizeUserComponent redirectTo={redirectTo} />;
  }

  return (
    <AuthorizeChatGptComponent
      csrfToken={csrfToken}
      code={code}
      consentAlreadyGranted={consentAlreadyGranted}
      user={user}
    />
  );
}

export const AuthorizeUserComponent = (props: { redirectTo: string }) => {
  const { redirectTo } = props;
  const [isSigningIn, setIsSigningIn] = useState(true);

  return (
    <div className="w-full h-full flex items-center justify-center">
      {isSigningIn ? (
        <SignInComponent
          options={{
            onSuccess: () => {
              window.location.href = decodeURIComponent(redirectTo);
            },
          }}
          searchParamsOverride={`?redirectTo=${redirectTo}`}
          overrideOnSignUp={() => setIsSigningIn(false)}
        />
      ) : (
        <SignUpComponent
          searchParamsOverride={`?redirectTo=${redirectTo}`}
          overrideOnSignIn={() => setIsSigningIn(true)}
        />
      )}
    </div>
  );
};

export const AuthorizeChatGptComponent = (props: {
  csrfToken: string;
  code: string;
  consentAlreadyGranted: boolean;
  user?: { email?: string };
}) => {
  const { csrfToken, code, consentAlreadyGranted, user } = props;
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const appName = process.env.GADGET_APP;

  const formRef = useRef<HTMLFormElement>(null);
  const allowAccess = useCallback(() => {
    setHasSubmitted(true);
    formRef.current?.submit();
  }, []);

  useEffect(() => {
    if (consentAlreadyGranted && formRef.current) {
      allowAccess();
    }
  }, [consentAlreadyGranted, allowAccess]);

  return (
    <>
      {!consentAlreadyGranted && (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md p-8 text-center">
            <ChatGPTLogo />

            <h1 className="text-xl font-normal text-gray-900 mb-8">
              <span className="font-semibold">ChatGPT</span> would like to access {appName}
            </h1>

            <p className="mb-3">Your account will:</p>
            <p className="mb-8">✓ Connect to the remote MCP server</p>

            <p className="text-sm text-gray-500 mb-8">
              Use of the {appName} app is subject to your existing agreement with {appName}.
            </p>

            <Button onClick={allowAccess} type="button" className="w-full mb-3" disabled={hasSubmitted}>
              Agree & Allow Access
            </Button>

            {user?.email && <p className="text-sm text-gray-500">Logged in as {user.email}</p>}
          </Card>
        </div>
      )}

      {/* Form submission POST request is needed to navigate away from the page */}
      <form ref={formRef} method="POST" action={`/api/oauth/v2/interaction/${code}/authorize`}>
        <input type="hidden" name="csrfToken" value={csrfToken} />
      </form>
    </>
  );
};

const ChatGPTLogo = () => (
  <div className="flex justify-center mb-2">
    <img src={openAILogo} alt="ChatGPT Logo" className="w-32 h-32" />
  </div>
);