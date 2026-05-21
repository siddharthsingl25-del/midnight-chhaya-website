import type { Metadata } from "next";
import PageHeader from "@/components/sections/PageHeader";
import PolicyContent, { type PolicyBlock } from "@/components/sections/PolicyContent";
import Footer from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Midnight Chhaya collects and handles your personal information.",
};

const blocks: PolicyBlock[] = [
  { type: "p", text: "We collect basic customer information such as:" },
  {
    type: "list",
    items: ["Name", "Address", "Phone number", "Email address", "Instagram handle"],
  },
  {
    type: "p",
    text:
      "Phone number and email are collected so that our courier partner can reach you for delivery and so we can send order updates. They are not used for marketing.",
  },
  { type: "p", text: "This information is used only for:" },
  {
    type: "list",
    items: ["Order processing", "Shipping", "Customer support"],
  },
  {
    type: "p",
    text:
      "We do not sell or share your personal information with third parties except payment gateways and courier services required to complete your order.",
  },
  {
    type: "p",
    text: "Payments are securely processed through trusted payment providers.",
  },
  {
    type: "p",
    text: "By using this website, you agree to our policies and terms.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Policies"
        title="Privacy policy."
        lede="What we collect, and what we do with it. Brief, plainly written."
      />
      <PolicyContent blocks={blocks} />
      <Footer />
    </>
  );
}
