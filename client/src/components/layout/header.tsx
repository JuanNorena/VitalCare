import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { CalendarDays, LogOut, Menu } from "lucide-react";
import { Link } from "wouter";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import { useTranslation } from "react-i18next";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function Header() {
  const { user, logout } = useUser();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center gap-4">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" aria-label={t("navigation.openMenu")}>
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[280px] p-0 h-full overflow-hidden">
            <SheetHeader className="sr-only">
              <VisuallyHidden>
                <SheetTitle>{t("navigation.menu")}</SheetTitle>
              </VisuallyHidden>
              <VisuallyHidden>
                <SheetDescription>{t("navigation.menu")}</SheetDescription>
              </VisuallyHidden>
            </SheetHeader>
            <Sidebar isMobile onClose={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2 flex-1">
          <Link href="/" className="flex items-center space-x-2">
            <CalendarDays className="h-6 w-6" />
            <span className={cn(
              "font-bold",
              "hidden sm:inline-block"
            )}>{t("common.appTitle")}</span>
          </Link>
        </div>

        <div className="flex items-center justify-end gap-4">
          {user && (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline-block">
                {user.username}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout()}
                title={t("auth.logout")}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}