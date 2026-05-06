"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/add", label: "Add", icon: AddIcon, primary: true },
  { href: "/archive", label: "Archive", icon: ArchiveIcon },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
      <div className="max-w-2xl mx-auto px-4 pb-4 pt-2">
        <div className="bg-surface border border-border rounded-3xl shadow-[0_4px_24px_rgba(42,26,46,0.06)] flex items-center justify-around px-2 py-2 pointer-events-auto">
          {tabs.map(({ href, label, icon: Icon, primary }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            if (primary) {
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  className="bg-accent text-accent-fg w-14 h-14 rounded-full flex items-center justify-center shadow-md hover:opacity-90 transition -my-2"
                >
                  <Icon className="w-6 h-6" />
                </Link>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition ${
                  active ? "text-foreground" : "text-muted"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px]">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function HomeIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

function ArchiveIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
      <path d="M10 12h4" />
    </svg>
  );
}

function AddIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
