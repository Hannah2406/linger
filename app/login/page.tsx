import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-muted mb-2 text-center">
          Linger
        </p>
        <h1 className="font-serif text-3xl text-foreground mb-8 text-center">
          Welcome
        </h1>
        <Suspense fallback={<div className="text-center text-muted text-sm">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
