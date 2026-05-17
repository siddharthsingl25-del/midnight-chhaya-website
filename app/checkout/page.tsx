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
        lede="A few delivery details — the order then opens in WhatsApp for you to send to us. We confirm and arrange payment + shipping within a day."
      />
      <CheckoutClient />
      <Footer />
    </>
  );
}
