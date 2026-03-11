import { LogOut, Zap } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CreateOfferPage } from "@/pages/CreateOfferPage";
import { LoginPage } from "@/pages/LoginPage";
import { MyOffersPage } from "@/pages/MyOffersPage";
import { PublicOffersPage } from "@/pages/PublicOffersPage";

type AuthedView = "create" | "myOffers" | "publicOffers";
type UnauthedView = "publicOffers" | "login";

export function App() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const [authedView, setAuthedView] = useState<AuthedView>("myOffers");
  const [unauthedView, setUnauthedView] = useState<UnauthedView>("publicOffers");

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (unauthedView === "login") {
      return <LoginPage />;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Zap size={18} />
              </div>
              <span className="font-semibold text-gray-900">EV Offer</span>
            </div>
            <button
              type="button"
              onClick={() => setUnauthedView("login")}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
            >
              Sign In
            </button>
          </div>
        </header>

        <PublicOffersPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Zap size={18} />
            </div>
            <span className="font-semibold text-gray-900">EV Offer</span>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden gap-2 text-sm text-gray-600 sm:flex">
              <button
                type="button"
                onClick={() => setAuthedView("publicOffers")}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  authedView === "publicOffers" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100"
                }`}
              >
                Public Offers
              </button>
              <button
                type="button"
                onClick={() => setAuthedView("myOffers")}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  authedView === "myOffers" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100"
                }`}
              >
                My Offers
              </button>
            </nav>
            <span className="hidden text-sm text-gray-500 sm:inline">{user?.username}</span>
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {authedView === "publicOffers" && <PublicOffersPage />}
      {authedView === "create" && <CreateOfferPage onCancel={() => setAuthedView("myOffers")} />}
      {authedView === "myOffers" && (
        <MyOffersPage onOpenCreateOffer={() => setAuthedView("create")} />
      )}
    </div>
  );
}
