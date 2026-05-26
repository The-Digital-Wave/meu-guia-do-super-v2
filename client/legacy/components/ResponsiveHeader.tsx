import { useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

type ResponsiveHeaderProps = {
  headerClassName: string;
  containerClassName: string;
  mobileTopContent: ReactNode;
  mobileMenuContent: ReactNode;
  desktopContent: ReactNode;
};

export function ResponsiveHeader({
  headerClassName,
  containerClassName,
  mobileTopContent,
  mobileMenuContent,
  desktopContent,
}: ResponsiveHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  function handleMobileMenuClick(event: ReactMouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement | null;

    if (target?.closest("a, button")) {
      setMenuOpen(false);
    }
  }

  return (
    <header className={headerClassName}>
      <div className={containerClassName}>
        <div className="flex items-center justify-between gap-4 lg:hidden">
          {mobileTopContent}
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-current/30"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        

        {menuOpen ? (
          <>
            <div className="mt-3 h-px bg-gradient-to-r from-transparent via-slate-400/45 to-transparent lg:hidden" />
            <div className="mt-3 grid gap-3 lg:hidden" onClick={handleMobileMenuClick}>
              {mobileMenuContent}
            </div>
          </>
        ) : null}

        <div className="hidden lg:block">{desktopContent}</div>
      </div>
    </header>
  );
}