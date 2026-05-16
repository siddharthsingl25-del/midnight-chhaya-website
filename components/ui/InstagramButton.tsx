import InstagramIcon from "./icons/InstagramIcon";
import { SITE } from "@/lib/site";

type Variant = "icon" | "label";

/**
 * Instagram link. `icon` for header/footer, `label` for hero/contact CTAs.
 * Antique-gold styling with a soft glow on hover.
 */
export default function InstagramButton({
  variant = "icon",
  className = "",
  label = "Follow our story",
}: {
  variant?: Variant;
  className?: string;
  label?: string;
}) {
  const shared =
    "group inline-flex items-center gap-3 text-gold transition-colors duration-500";

  if (variant === "label") {
    return (
      <a
        href={SITE.instagram}
        target="_blank"
        rel="noopener noreferrer"
        data-cursor="Instagram"
        className={`${shared} eyebrow hover:text-gold-soft ${className}`}
      >
        <span
          className="relative grid place-items-center rounded-full border border-gold/40 p-3
                     transition-all duration-500 group-hover:border-gold
                     group-hover:shadow-[0_0_24px_-2px_rgba(184,147,90,0.45)]"
        >
          <InstagramIcon size={20} />
        </span>
        <span className="gold-underline">{label}</span>
      </a>
    );
  }

  return (
    <a
      href={SITE.instagram}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Follow Midnight Chhaya on Instagram"
      data-cursor="Instagram"
      className={`${shared} hover:text-gold-soft ${className}`}
    >
      <span
        className="grid place-items-center rounded-full border border-gold/30 p-2
                   transition-all duration-500 hover:border-gold
                   hover:shadow-[0_0_18px_-2px_rgba(184,147,90,0.45)]"
      >
        <InstagramIcon size={18} />
      </span>
    </a>
  );
}
