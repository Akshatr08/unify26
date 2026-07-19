import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import unifyMark from "../assets/unify-mark.png";
import { Toaster } from "@/components/ui/sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This route isn't part of the UNIFY/26 operations console.
        </p>
        <div className="mt-6">
          <Link
            to="/command"
            className="inline-flex items-center justify-center rounded-md bg-pitch px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            Return to Command
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    console.error("[UNIFY/26 error boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
          Console offline
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A subsystem failed to load. Retry or return to Command.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-pitch px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Home
          </a>
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
      { title: "UNIFY/26 — FIFA World Cup 2026 Stadium Operations" },
      {
        name: "description",
        content:
          "GenAI-powered command console for FIFA World Cup 2026: fan concierge, staff dispatch, and stadium operations intelligence in one unified platform.",
      },
      { name: "author", content: "UNIFY/26" },
      { property: "og:title", content: "UNIFY/26 — FIFA World Cup 2026 Stadium Operations" },
      {
        property: "og:description",
        content:
          "GenAI-powered command console for FIFA World Cup 2026 stadium operations, fan wayfinding, and multilingual assistance.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://unify26.vercel.app/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@unify26" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;600;700&family=Inter:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "canonical", href: "https://unify26.vercel.app/" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const NAV = [
  { to: "/command", label: "Command" },
  { to: "/staff", label: "Staff" },
  { to: "/fan", label: "Fan" },
] as const;

function TopNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="Primary Navigation" className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur px-6">
      <div className="flex items-center gap-8">
        <Link to="/command" className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--fifa-red)]/60 rounded-md" aria-label="UNIFY/26 home">
          <img src={unifyMark} alt="" width={28} height={28} className="h-7 w-7" />
          <span className="font-display text-xl font-bold tracking-tighter text-[color:var(--fifa-red)]">
            UNIFY/26
          </span>
        </Link>
        <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1" role="tablist" aria-label="Role modes">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                role="tab"
                aria-selected={active}
                aria-current={active ? "page" : undefined}
                className={
                  "rounded-full px-4 py-1 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--fifa-red)]/60 " +
                  (active
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-600 hover:text-slate-900")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 rounded-md bg-[color:var(--fifa-red)]/10 px-3 py-1.5 text-[11px] font-bold tracking-wide text-[color:var(--fifa-red)]">
          <span className="size-2 animate-pulse rounded-full bg-[color:var(--fifa-red)]" />
          LIVE · METLIFE STADIUM
        </div>
        <div className="hidden lg:flex flex-col items-end text-right">
          <span className="text-[10px] uppercase tracking-widest text-slate-400">Matchday</span>
          <span className="text-xs font-semibold text-slate-800">Group F · Day 12</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Operator menu"
            className="size-8 rounded-full bg-slate-200 ring-1 ring-black/5 grid place-items-center text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--fifa-red)]/60"
          >
            OC
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Ops Coordinator</span>
                <span className="text-[11px] font-normal text-slate-500">
                  ops.coordinator@unify26
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => toast("Profile", { description: "MetLife Stadium · Zone Command" })}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast("Preferences", { description: "Coming soon in build 2." })}>
              Preferences
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast("Shift handover logged", { description: "Next: 22:00" })}>
              Shift handover
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => toast.success("Signed out (demo)")}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-slate-50 font-sans text-[color:var(--pitch)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[color:var(--fifa-red)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          Skip to main content
        </a>
        <TopNav />
        <div id="main-content" tabIndex={-1} className="focus:outline-none">
          <Outlet />
        </div>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}
