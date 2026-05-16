/**
 * Inline Instagram glyph — lucide-react 1.x dropped brand icons, so we ship our own.
 * Stroke-based (matches the rest of the lucide-style line work).
 */
type Props = React.SVGProps<SVGSVGElement> & { size?: number };

export default function InstagramIcon({ size = 18, ...props }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}
