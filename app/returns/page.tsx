import type { Metadata } from "next";
import PageHeader from "@/components/sections/PageHeader";
import PolicyContent, { type PolicyBlock } from "@/components/sections/PolicyContent";
import Footer from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "Returns & Replacements",
  description:
    "How returns and replacements work for Midnight Chhaya orders.",
};

const blocks: PolicyBlock[] = [
  {
    type: "p",
    text:
      "Due to limited-stock reasons, we do not offer returns or refunds after delivery.",
  },
  { type: "p", text: "However, replacements are available if:" },
  {
    type: "list",
    items: ["You receive a damaged item", "You receive the wrong product"],
  },
  { type: "p", text: "To request a replacement:" },
  {
    type: "list",
    items: [
      "Contact us within 48 hours of delivery",
      "Share clear unboxing video/photos as proof",
    ],
  },
  {
    type: "p",
    text:
      "Replacement requests without unboxing proof may not be accepted.",
  },
  {
    type: "p",
    text: "Customised products are non-returnable and non-refundable.",
  },
  {
    type: "p",
    text: "Midnight Chhaya reserves the right to reject fraudulent claims.",
  },
];

export default function ReturnsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Policies"
        title="Returns & replacements."
        lede="Limited stock, hand-finished pieces — here's how exchanges work."
      />
      <PolicyContent blocks={blocks} />
      <Footer />
    </>
  );
}
