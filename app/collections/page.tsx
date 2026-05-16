import type { Metadata } from "next";
import PageHeader from "@/components/sections/PageHeader";
import Footer from "@/components/ui/Footer";
import CollectionsGrid from "./CollectionsGrid";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Rings, pendants, earrings and chokers — every piece forged, oxidised and finished by hand.",
};

export default function CollectionsPage() {
  return (
    <>
      <PageHeader
        eyebrow="The Collection"
        title="Adornments by hand."
        lede="Rings, pendants, earrings and chokers. Made slowly, in small batches, in a room that smells of solder and beeswax."
      />
      <CollectionsGrid />
      <Footer />
    </>
  );
}
