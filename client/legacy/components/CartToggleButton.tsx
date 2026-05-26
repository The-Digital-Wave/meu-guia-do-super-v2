import { ShoppingCart } from "lucide-react";

type CartToggleButtonProps = {
  count: number;
  onClick: () => void;
  className?: string;
  buttonClassName?: string;
  iconClassName?: string;
  badgeClassName?: string;
};

export function CartToggleButton({
  count,
  onClick,
  className,
  buttonClassName,
  iconClassName,
  badgeClassName,
}: CartToggleButtonProps) {
  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        className={buttonClassName ?? "flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-panel"}
        aria-label="Abrir carrinho"
      >
        <ShoppingCart className={iconClassName ?? "h-6 w-6"} />
      </button>
      {count > 0 ? (
        <span className={badgeClassName ?? "pointer-events-none absolute -right-3 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-coral px-1 text-xs font-bold text-white"}>
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </div>
  );
}