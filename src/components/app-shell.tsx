"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronDown,
  Image,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Radio,
  PenLine,
  QrCode,
  Send,
  Settings,
  UsersRound,
  X,
  Bell,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "QR Codes", href: "/qr-codes", icon: QrCode },
  { label: "NFC Cards", href: "/nfc", icon: Radio },
  { label: "Configuration", href: "/configuration", icon: Settings },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Content Calendar", href: "#", icon: CalendarDays },
  { label: "Post Composer", href: "#", icon: PenLine },
  { label: "Messages & Comments", href: "#", icon: MessageSquare },
  
];

export function AppShell({
  children,
  dateLabel,
}: {
  children: React.ReactNode;
  dateLabel: string;
}) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      {mobileNavOpen && (
        <button
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-40 bg-slate-950/55 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col overflow-y-auto bg-[#0f1c33] px-4 py-6 text-slate-300 transition-transform lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-auto lg:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-7 flex items-center justify-between gap-2 px-2">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center text-4xl font-bold leading-none text-amber-400">
              △
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold leading-tight text-white">
                Ascend Media Works
              </span>
              <span className="mt-1 text-[8px] tracking-[0.16em] text-slate-500">
                CREATE · CONNECT · GROW
              </span>
            </span>
          </Link>
          <button
            className="rounded-md p-1 text-slate-300 hover:bg-white/10 lg:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
          {navigation.map(({ label, href, icon: Icon }) => {
            const active =
              href !== "#" && (href === "/" ? pathname === "/" : pathname.startsWith(href));
            return (
              <Link
                key={label}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileNavOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
                }`}
              >
                <Icon className="size-[18px] shrink-0" strokeWidth={1.8} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-5 flex items-center gap-3 rounded-xl bg-white/[0.06] p-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
            B
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold text-white">Bobby</span>
            <span className="mt-1 block text-[10px] text-slate-400">
              Social Media Manager
            </span>
          </span>
          <ChevronDown className="size-4 text-slate-500" />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-9 lg:pt-7">
          <button
            className="rounded-lg border bg-white p-2 text-slate-600 shadow-sm lg:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <div className="hidden min-w-0 flex-1 sm:block">
            <p className="text-xs font-medium text-slate-500">Good morning, Bobby! 👋</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="inline-flex h-10 items-center gap-2 rounded-lg border bg-white px-3 text-xs font-medium text-slate-700 shadow-sm">
              <CalendarDays className="size-4 text-slate-500" />
              {dateLabel}
              <ChevronDown className="size-3.5 text-slate-400" />
            </button>
            <button
              aria-label="Notifications"
              className="relative flex size-10 items-center justify-center rounded-lg border bg-white text-slate-600 shadow-sm"
            >
              <Bell className="size-[18px]" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500" />
            </button>
          </div>
        </header>
        <main className="px-5 pb-8 sm:px-8 lg:px-9">{children}</main>
        <footer className="flex justify-between gap-4 px-5 pb-5 text-[10px] text-slate-400 sm:px-8 lg:px-9">
          <span>© {new Date().getFullYear()} Ascend Media Works</span>
          <span>CREATE · CONNECT · GROW</span>
        </footer>
      </div>
    </div>
  );
}
