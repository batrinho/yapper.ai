"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BookOpen,
  ChartNoAxesColumn,
  ChevronsLeft,
  CreditCard,
  Flame,
  House,
  LogOut,
  Menu,
  Mic,
  Moon,
  Settings,
  Sun,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { useToday } from "@/lib/hooks";
import { setSidebarCollapsed, usePreferences } from "@/lib/preferences";
import { displayStreak, type Streak } from "backend/stats";
import { useApplyTheme, useTheme } from "@/lib/theme";
import { Avatar, initials, LogoMark, Wordmark } from "@/components/ui";

type NavItem = { href: string; label: string; icon: LucideIcon; isActive: (path: string) => boolean };

const isPracticePath = (path: string) => path.includes("/practice/");

function navItems(practiceHref: string): NavItem[] {
  return [
    { href: "/", label: "Home", icon: House, isActive: (p) => p === "/" },
    { href: "/courses", label: "Courses", icon: BookOpen, isActive: (p) => p.startsWith("/courses") && !isPracticePath(p) },
    { href: practiceHref, label: "Practice", icon: Mic, isActive: isPracticePath },
    { href: "/progress", label: "Progress", icon: ChartNoAxesColumn, isActive: (p) => p.startsWith("/progress") },
    { href: "/profile", label: "Profile", icon: User, isActive: (p) => p.startsWith("/profile") },
    { href: "/billing", label: "Billing", icon: CreditCard, isActive: (p) => p.startsWith("/billing") },
    { href: "/settings", label: "Settings", icon: Settings, isActive: (p) => p.startsWith("/settings") },
  ];
}

const rowBase = "flex h-11 w-full items-center gap-3 rounded-xl px-[14px] text-[15px] font-medium transition-colors duration-200";
const rowIdle = "text-muted hover:bg-surface-2 hover:text-text";

function Label({ hidden, children }: { hidden: boolean; children: ReactNode }) {
  return (
    <span className={`truncate whitespace-nowrap transition-opacity duration-200 ${hidden ? "opacity-0" : "opacity-100"}`}>
      {children}
    </span>
  );
}

function NavLinks({ path, rail, practiceHref, onNavigate }: { path: string; rail: boolean; practiceHref: string; onNavigate?: () => void }) {
  return (
    <ul className="flex flex-col gap-1">
      {navItems(practiceHref).map(({ href, label, icon: Icon, isActive }) => {
        const active = isActive(path);
        return (
          <li key={label}>
            <Link
              href={href}
              onClick={onNavigate}
              title={rail ? label : undefined}
              aria-current={active ? "page" : undefined}
              className={`${rowBase} ${active ? "bg-tint text-accent-ink" : rowIdle}`}
            >
              <Icon size={20} strokeWidth={1.75} className="shrink-0" aria-hidden />
              <Label hidden={rail}>{label}</Label>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function StreakItem({ rail, streak }: { rail: boolean; streak: Streak }) {
  const today = useToday();
  const days = today ? displayStreak(streak, today) : null;
  const practicedToday = Boolean(today && streak.lastPracticeDate === today);

  let title = "Your streak";
  let sub = "Practice today to keep it";
  if (days === 0) {
    title = "Start a streak";
    sub = "Practice today to begin";
  } else if (days !== null) {
    title = `${days}-day streak`;
    sub = practicedToday ? "You practiced today. Nice." : "Practice today to keep it";
  }

  return (
    <div className="flex min-h-[52px] items-center gap-3 rounded-xl bg-tint px-[14px] py-2" title={rail ? `${title}. ${sub}` : undefined}>
      <Flame size={20} className="shrink-0 fill-accent text-accent" aria-hidden />
      <div className={`min-w-0 transition-opacity duration-200 ${rail ? "opacity-0" : "opacity-100"}`}>
        <p className="truncate whitespace-nowrap text-[14px] font-bold">{title}</p>
        <p className="truncate whitespace-nowrap text-[12px] text-muted">{sub}</p>
      </div>
    </div>
  );
}

function ThemeToggle({ rail }: { rail: boolean }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  const Icon = dark ? Moon : Sun;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      title={rail ? "Dark mode" : undefined}
      onClick={toggle}
      className={`${rowBase} ${rowIdle}`}
    >
      <Icon size={20} strokeWidth={1.75} className="shrink-0" aria-hidden />
      <Label hidden={rail}>Dark mode</Label>
      <span
        aria-hidden
        className={`ml-auto flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-all duration-200 ${
          dark ? "bg-accent" : "bg-line-strong"
        } ${rail ? "opacity-0" : "opacity-100"}`}
      >
        <span className={`size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${dark ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}

function UserRow({ rail, name, onNavigate }: { rail: boolean; name: string; onNavigate?: () => void }) {
  const router = useRouter();

  async function switchName() {
    await fetch("/api/session", { method: "DELETE" });
    router.replace("/welcome");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      <Link
        href="/profile"
        onClick={onNavigate}
        title={rail ? name : undefined}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-[6px] py-2 transition-colors hover:bg-surface-2"
      >
        <Avatar initials={initials(name)} />
        <span className={`min-w-0 transition-opacity duration-200 ${rail ? "opacity-0" : "opacity-100"}`}>
          <span className="block truncate whitespace-nowrap text-[15px] font-semibold">{name}</span>
          <span className="block truncate whitespace-nowrap text-[13px] text-muted">View profile</span>
        </span>
      </Link>
      {!rail && (
        <button
          type="button"
          onClick={switchName}
          title="Switch name"
          aria-label="Switch name"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-text"
        >
          <LogOut size={17} aria-hidden />
        </button>
      )}
    </div>
  );
}

type ShellProps = { userName: string; streak: Streak; practiceHref: string };

function Sidebar({ path, userName, streak, practiceHref }: ShellProps & { path: string }) {
  const { sidebarCollapsed } = usePreferences();
  const [expandedOn, setExpandedOn] = useState<string | null>(null);
  const focusRoute = isPracticePath(path);
  const rail = focusRoute ? expandedOn !== path : sidebarCollapsed;

  const toggle = () => {
    if (focusRoute) setExpandedOn(rail ? path : null);
    else setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <aside
      className={`sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden border-r border-line bg-surface px-3 py-6 transition-[width] duration-[260ms] ease-out-soft md:flex ${
        rail ? "w-[72px]" : "w-[248px]"
      }`}
    >
      <Link href="/" className="mb-8 flex items-center gap-3 px-[9px]" aria-label="yapper.ai home">
        <LogoMark />
        <span className={`transition-opacity duration-200 ${rail ? "opacity-0" : "opacity-100"}`}>
          <Wordmark />
        </span>
      </Link>

      <nav aria-label="Main">
        <NavLinks path={path} rail={rail} practiceHref={practiceHref} />
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        <StreakItem rail={rail} streak={streak} />
        <div className="mt-2" />
        <ThemeToggle rail={rail} />
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!rail}
          aria-label={rail ? "Expand sidebar" : "Collapse sidebar"}
          title={rail ? "Expand" : undefined}
          className={`${rowBase} ${rowIdle}`}
        >
          <ChevronsLeft
            size={20}
            strokeWidth={1.75}
            className={`shrink-0 transition-transform duration-[260ms] ${rail ? "rotate-180" : ""}`}
            aria-hidden
          />
          <Label hidden={rail}>Collapse</Label>
        </button>
        <hr className="my-3 border-line" />
        <UserRow rail={rail} name={userName} />
      </div>
    </aside>
  );
}

function MobileBar({ path, userName, streak, practiceHref }: ShellProps & { path: string }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg md:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2" onClick={close} aria-label="yapper.ai home">
          <LogoMark size={26} />
          <Wordmark />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="grid size-10 place-items-center rounded-xl text-muted hover:bg-surface-2"
        >
          {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
        </button>
      </div>
      {open && (
        <div id="mobile-menu" className="fade-up flex flex-col gap-1 border-t border-line bg-bg px-3 pb-4 pt-3">
          <nav aria-label="Main">
            <NavLinks path={path} rail={false} practiceHref={practiceHref} onNavigate={close} />
          </nav>
          <div className="mt-3 flex flex-col gap-1">
            <StreakItem rail={false} streak={streak} />
            <ThemeToggle rail={false} />
            <UserRow rail={false} name={userName} onNavigate={close} />
          </div>
        </div>
      )}
    </header>
  );
}

export function Shell({ children, ...props }: ShellProps & { children: ReactNode }) {
  const path = usePathname();
  useApplyTheme();

  return (
    <div className="min-h-dvh md:flex">
      <Sidebar path={path} {...props} />
      <MobileBar path={path} {...props} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
