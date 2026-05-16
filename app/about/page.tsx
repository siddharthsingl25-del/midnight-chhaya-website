import type { Metadata } from "next";
import PageHeader from "@/components/sections/PageHeader";
import Footer from "@/components/ui/Footer";
import AboutNarrative from "./AboutNarrative";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story of Midnight Chhaya — a small atelier making gothic jewelry by hand, slowly, after dark.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="The Atelier"
        title="A small room. A late hour."
        lede="The making, the material, the people. Read slowly."
      />
      <AboutNarrative />
      <Footer />
    </>
  );
}
