import Link from "next/link";

export default function PageHeader({
  title,
  back,
  right,
}: {
  title?: string;
  back?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-md px-5 py-4 flex items-center justify-between border-b border-border/60">
      <div className="flex items-center gap-3 min-w-0">
        {back && (
          <Link
            href={back}
            className="w-9 h-9 -ml-2 rounded-full flex items-center justify-center hover:bg-accent-soft transition"
            aria-label="Back"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
        )}
        {title && (
          <h1 className="font-serif text-2xl text-foreground truncate">
            {title}
          </h1>
        )}
      </div>
      {right}
    </header>
  );
}
