import { Zap } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { validateSignUpPassword } from "@/services/auth/services";

type AuthMode = "signIn" | "signUp" | "confirm";

export function LoginPage() {
  const { signIn, signUp, confirmSignUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "signIn") {
        await signIn(email, password);
      } else if (mode === "signUp") {
        const passwordError = validateSignUpPassword(password);
        if (passwordError) {
          setError(passwordError);
          setIsSubmitting(false);
          return;
        }
        const { needsConfirmation } = await signUp(email, password);
        if (needsConfirmation) {
          setMode("confirm");
        }
      } else if (mode === "confirm") {
        await confirmSignUp(email, confirmCode);
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
            <Zap size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">EV Offer</h1>
          <p className="mt-1 text-sm text-gray-500">Sell your electric vehicle with ease</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl shadow-gray-200/50">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            {mode === "signIn" && "Sign in to your account"}
            {mode === "signUp" && "Create an account"}
            {mode === "confirm" && "Confirm your email"}
          </h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode !== "confirm" ? (
              <>
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder={
                      mode === "signUp"
                        ? "8+ chars, upper, lower, number, symbol"
                        : "Min. 8 characters"
                    }
                  />
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="code" className="mb-1 block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Enter 6-digit code"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Check your email for the verification code
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "Please wait..."
                : mode === "signIn"
                  ? "Sign In"
                  : mode === "signUp"
                    ? "Create Account"
                    : "Verify & Sign In"}
            </button>
          </form>

          {mode !== "confirm" && (
            <p className="mt-6 text-center text-sm text-gray-500">
              {mode === "signIn" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signIn" ? "signUp" : "signIn");
                  setError("");
                }}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                {mode === "signIn" ? "Sign up" : "Sign in"}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
