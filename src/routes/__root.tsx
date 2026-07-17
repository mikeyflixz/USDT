import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppProvider } from "../lib/app-state";

function NotFoundComponent() {
  return (
    <div className="bg-app grid-bg flex min-h-screen items-center justify-center px-4">
      <div className="glass-card max-w-md p-10 text-center">
        <h1 className="text-gradient text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This route doesn't exist in SecureEscrow.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="glow-primary inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="bg-app flex min-h-screen items-center justify-center px-4">
      <div className="glass-card max-w-md p-10 text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110"
          >
            Try again
          </button>
          <a href="/" className="rounded-lg border border-border px-4 py-2 text-sm">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SecureEscrow — Trustless P2P USDT Escrow" },
      { name: "description", content: "SecureEscrow is a premium P2P USDT escrow experience — secure, transparent, and instant settlement across multiple chains." },
      { name: "author", content: "SecureEscrow" },
      { property: "og:title", content: "SecureEscrow — Trustless P2P USDT Escrow" },
      { property: "og:description", content: "Secure peer-to-peer USDT escrow with instant settlement." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-app min-h-screen text-foreground antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <div className="relative min-h-screen overflow-hidden">
          <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
            <div className="animate-blob absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
            <div className="animate-blob absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-violet/15 blur-3xl [animation-delay:-4s]" />
            <div className="animate-blob absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-emerald/15 blur-3xl [animation-delay:-8s]" />
            <div className="grid-bg absolute inset-0 opacity-40" />
          </div>
          <Outlet />
          <Toaster theme="dark" position="top-right" richColors closeButton />
        </div>
      </AppProvider>
    </QueryClientProvider>
  );
}
