import type { Metadata } from "next";
import PageHeader from "@/components/sections/PageHeader";
import Footer from "@/components/ui/Footer";
import LookbookMasonry from "./LookbookMasonry";

export const metadata: Metadata = {
  title: "Lookbook",
  description:
    "Editorial stills of Midnight Chhaya pieces — pieces worn, pieces being made.",
};

export default function LookbookPage() {
  return (
    <>
      <PageHeader
        eyebrow="Lookbook"
        title="Worn in shadow."
        lede="An archive of the pieces in light. Click any image to enlarge."
      />
      <LookbookMasonry />
      <Footer />
    </>
  );
}
