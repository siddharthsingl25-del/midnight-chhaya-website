import Hero from "@/components/sections/Hero";
import FeaturedPieces from "@/components/sections/FeaturedPieces";
import BrandTeaser from "@/components/sections/BrandTeaser";
import LookbookPreview from "@/components/sections/LookbookPreview";
import InstagramCTA from "@/components/sections/InstagramCTA";
import Footer from "@/components/ui/Footer";

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedPieces />
      <BrandTeaser />
      <LookbookPreview />
      <InstagramCTA />
      <Footer />
    </>
  );
}
