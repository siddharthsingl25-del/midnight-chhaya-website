import type { Metadata } from "next";
import PageHeader from "@/components/sections/PageHeader";
import Footer from "@/components/ui/Footer";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Complete your Midnight Chhaya order — fill delivery details and confirm via Instagram.",
};

export default function CheckoutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Checkout"
        title="Place your order."
        lede="A few delivery details and you&apos;re done. Pay securely via Razorpay — UPI, card, netbanking. We ship within 1–3 business days."
      />
      <CheckoutClient />
      <Footer />
    </>
  );
}
