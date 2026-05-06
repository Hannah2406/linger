"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/home";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push(next);
        router.refresh();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else if (data.session) {
        router.push(next);
        router.refresh();
      } else {
        setInfo("Check your email to confirm your account.");
      }
    }

    setLoading(false);
  }

  async function handleGoogle() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-surface border border-border rounded-full py-3 px-4 hover:bg-accent-soft transition"
      >
        <GoogleIcon />
        <span className="text-sm font-medium">Continue with Google</span>
      </button>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-surface border border-border rounded-2xl px-4 py-3 outline-none focus:border-accent transition"
        />
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-surface border border-border rounded-2xl px-4 py-3 outline-none focus:border-accent transition"
        />

        {error && (
          <p className="text-sm text-red-700 bg-red-50 rounded-xl px-4 py-2">
            {error}
          </p>
        )}
        {info && (
          <p className="text-sm text-foreground bg-accent-soft rounded-xl px-4 py-2">
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-accent-fg rounded-full py-3 font-medium hover:opacity-90 transition"
        >
          {loading
            ? "..."
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        {mode === "signin" ? (
          <>
            New here?{" "}
            <button
              onClick={() => setMode("signup")}
              className="text-foreground underline underline-offset-2"
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              onClick={() => setMode("signin")}
              className="text-foreground underline underline-offset-2"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
