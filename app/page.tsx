import Link from "next/link";

export default function Landing() {
  return (
    <main className="flex-1 flex flex-col relative overflow-hidden bg-soft-gradient">
      <span className="orb w-72 h-72 -top-24 -left-16 bg-accent-soft" />
      <span className="orb w-80 h-80 top-1/3 -right-24 bg-lilac-soft" />
      <span className="orb w-64 h-64 -bottom-20 left-12 bg-success-soft" />

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted mb-5">
          Linger
        </p>
        <h1 className="font-serif text-5xl md:text-6xl leading-[1.05] text-foreground mb-6">
          Wait before
          <br />
          you buy.
        </h1>
        <p className="text-lg text-muted max-w-md mb-10 leading-relaxed">
          A small, soft cooldown for the things you want.
          Add them, wait a week, and decide once it&apos;s quiet.
        </p>
        <Link
          href="/login"
          className="bg-accent text-accent-fg px-8 py-3.5 rounded-full font-medium hover:opacity-90 transition shadow-[0_8px_28px_rgba(217,138,166,0.35)]"
        >
          Get started
        </Link>
        <p className="text-xs text-muted mt-6">
          Free. No ads. No affiliate links.
        </p>
      </div>
    </main>
  );
}
