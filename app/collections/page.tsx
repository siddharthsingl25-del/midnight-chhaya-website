import type { Metadata } from "next";
import { Suspense } from "react";
import PageHeader from "@/components/sections/PageHeader";
import Footer from "@/components/ui/Footer";
import CollectionsGrid from "./CollectionsGrid";

export const metadata: Metadata = {
  title: "Collections",
  description:
    "Chains, keychains, bracelets and rings — every piece forged, oxidised and finished by hand.",
};

export default function CollectionsPage() {
  return (
    <>
      <PageHeader
        eyebrow="The Collection"
        title="Adornments by hand."
        lede="Chains, keychains, bracelets and rings. Made slowly, in small batches, in a room that smells of solder and beeswax."
      />
      {/* Suspense boundary — required because CollectionsGrid reads
       * useSearchParams (?cat=…) which opts the route out of static rendering
       * unless suspended. */}
      <Suspense fallback={<div className="min-h-[40vh]" />}>
        <CollectionsGrid />
      </Suspense>
      <Footer />
    </>
  );
}
