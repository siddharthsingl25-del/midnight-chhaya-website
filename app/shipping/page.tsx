import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/sections/PageHeader";
import PolicyContent, { type PolicyBlock } from "@/components/sections/PolicyContent";
import Footer from "@/components/ui/Footer";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "Processing times, delivery windows, and shipping fees for Midnight Chhaya orders.",
};

const blocks: PolicyBlock[] = [
  {
    type: "list",
    items: [
      "Orders are processed within 1–3 business days after confirmation.",
      "Delivery usually takes 4–9 business days depending on location.",
      <span key="free-shipping">Free shipping is available on prepaid orders above {SITE.currency.symbol}999</span>,
      <span key="below-fee">Orders below {SITE.currency.symbol}999 includes a shipping fee.</span>,
      "Tracking details will be shared once the order is shipped.",
      "Delivery delays may occur during holidays, sales, or courier issues.",
    ],
  },
  {
    type: "p",
    text: (
      <>
        For any shipping-related questions, contact us on{" "}
        <a
          href={SITE.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold gold-underline"
        >
          WhatsApp
        </a>{" "}
        or{" "}
        <Link
          href={SITE.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold gold-underline"
        >
          Instagram
        </Link>
        .
      </>
    ),
  },
];

export default function ShippingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Policies"
        title="Shipping policy."
        lede="What to expect after your order is confirmed."
      />
      <PolicyContent blocks={blocks} />
      <Footer />
    </>
  );
}
