import Hero from "@/components/sections/Hero";
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
      <PreOrder />
      <PromoCodeAnnouncement />
      <FeaturedPieces />
      <BrandTeaser />
      <InstagramCTA />
      <Footer />
    </>
  );
}
