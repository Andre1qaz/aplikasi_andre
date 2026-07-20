"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import {
  ChevronDown,
  LogOut,
  User,
  ClipboardList,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRoleLabel } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface TopNavbarProps {
  user: {
    name: string;
    email: string;
    role: string;
    id?: string;
    accessToken?: string;
  };
  onMenuClick?: () => void;
  breadcrumbs?: { label: string; href?: string }[];
}

export function TopNavbar({ user, onMenuClick, breadcrumbs }: TopNavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Buka menu"
          >
            <Menu className="size-5" />
          </Button>

          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 text-sm">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-muted-foreground">/</span>}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/${user.role.toLowerCase()}/exams`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ClipboardList className="size-4" />
              <span className="hidden sm:inline">Ujian</span>
            </Button>
          </Link>

          {user.id && user.accessToken && (
            <NotificationBell token={user.accessToken} userId={user.id} />
          )}

          <div className="relative group">
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-tight">{user.name}</p>
                <p className="text-xs text-muted-foreground">{getRoleLabel(user.role)}</p>
              </div>
              <ChevronDown className="size-4 text-muted-foreground hidden sm:block" />
            </button>

            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-card py-1 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <Link
                href={`/${user.role.toLowerCase()}/profile`}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
              >
                <User className="size-4" />
                Profil
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
              >
                <LogOut className="size-4" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
