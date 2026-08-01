import { useState } from "react";

import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { sfx } from "@/lib/game/sound";
import { ScreenHeader } from "./ScreenHeader";

type Mode = "signin" | "signup" | "reset";

export function AuthScreen({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");
    if (mode !== "reset" && password.length < 6) return setError("Password must be at least 6 characters.");
    if (mode === "signup" && username.trim().length < 2) return setError("Please choose a username (2+ characters).");

    setBusy(true);
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: username.trim().slice(0, 20) },
          },
        });
        if (err) throw err;
        sfx.levelComplete();
        onDone();
      } else if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        sfx.levelComplete();
        onDone();
      } else {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (err) throw err;
        setNotice("Check your inbox for a password reset link.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(
        /invalid login/i.test(message)
          ? "Incorrect email or password."
          : /already registered|already exists/i.test(message)
            ? "That email already has an account — try logging in."
            : message,
      );
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      setError("Google sign-in failed. Please try again.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    onDone();
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      <ScreenHeader
        title={mode === "signup" ? "Create account" : mode === "signin" ? "Log in" : "Reset password"}
        subtitle="Save your progress and play on any device"
        onBack={onBack}
      />

      <form className="panel space-y-3 p-5" onSubmit={submit}>
        {mode === "signup" && (
          <Field id="username" label="Username" value={username} onChange={setUsername} placeholder="ColorMaster" />
        )}
        <Field id="email" label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        {mode !== "reset" && (
          <Field
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="At least 6 characters"
          />
        )}

        {error && <p className="rounded-xl bg-[var(--destructive)]/15 px-3 py-2 text-sm font-bold text-[var(--destructive)]">{error}</p>}
        {notice && <p className="rounded-xl bg-[var(--success)]/15 px-3 py-2 text-sm font-bold text-[var(--success)]">{notice}</p>}

        <button className="btn btn-primary w-full" type="submit" disabled={busy}>
          {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "signin" ? "Log in" : "Send reset link"}
        </button>
      </form>

      {mode !== "reset" && (
        <>
          <div className="my-4 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
            <span className="h-px flex-1 bg-[var(--border)]" /> or <span className="h-px flex-1 bg-[var(--border)]" />
          </div>
          <button className="btn w-full" onClick={() => void google()} disabled={busy}>
            Continue with Google
          </button>
        </>
      )}

      <div className="mt-5 space-y-2 text-center text-sm">
        {mode === "signup" ? (
          <button className="font-bold underline" onClick={() => setMode("signin")}>
            Already have an account? Log in
          </button>
        ) : (
          <button className="font-bold underline" onClick={() => setMode("signup")}>
            New here? Create an account
          </button>
        )}
        {mode !== "reset" && (
          <div>
            <button className="text-[var(--muted-foreground)] underline" onClick={() => setMode("reset")}>
              Forgot password?
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
        Your guest progress is merged into your account automatically — nothing gets lost.
      </p>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-bold" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={type === "password" ? "current-password" : id}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--input)] px-4 py-3 text-base outline-none focus:border-[var(--primary)]"
      />
    </div>
  );
}
