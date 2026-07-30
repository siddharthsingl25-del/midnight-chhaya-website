import Hero from "@/components/sections/Hero";
import CategoryTiles from "@/components/sections/CategoryTiles";
import FeaturedShowcase from "@/components/sections/FeaturedShowcase";
import PromoImageBanner from "@/components/sections/PromoImageBanner";
import PreOrder from "@/components/sections/PreOrder";
import PromoCodeAnnouncement from "@/components/sections/PromoCodeAnnouncement";
import FeaturedPieces from "@/components/sections/FeaturedPieces";
import BrandTeaser from "@/components/sections/BrandTeaser";
import InstagramCTA from "@/components/sections/InstagramCTA";
import Footer from "@/components/ui/Footer";

export default function Home() {
  return (
    <>
      <Hero />
      <CategoryTiles />
      <FeaturedShowcase />
      <PromoImageBanner />
      <PreOrder />
      <PromoCodeAnnouncement />
      <FeaturedPieces />
      <BrandTeaser />
      <InstagramCTA />
      <Footer />
    </>
  );
}
