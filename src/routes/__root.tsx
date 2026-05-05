import { Outlet, Link, createRootRoute } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ODDSPrime — Prime Odds, Smart Wins | German's Best Football Predictions" },
      { name: "description", content: "Accurate football predictions and correct scores for German. Free daily tips and premium picks. Pay with Paystack in GHS." },
      { name: "keywords", content: "German football predictions, correct score, betting tips, Paystack, ODDSPrime, accumulator odds" },
      { name: "author", content: "ODDSPrime" },
      { property: "og:title", content: "ODDSPrime — Prime Odds, Smart Wins" },
      { property: "og:description", content: "Premium football predictions for German. Fixed, accurate, fast." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://oddsprime.online" },
      { property: "og:image", content: "https://oddsprime.online/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ODDSPrime — Prime Odds, Smart Wins" },
      { name: "twitter:description", content: "German's premium football prediction platform." },
      { name: "twitter:image", content: "https://oddsprime.online/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://oddsprime.online" }],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}
