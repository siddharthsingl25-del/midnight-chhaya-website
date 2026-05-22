import type { Metadata } from "next";
import FeedbackForm from "./FeedbackForm";
import Footer from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "How was your piece?",
  description: "Rate your Midnight Chhaya order.",
};

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  return (
    <>
      <section className="px-6 md:px-10 pt-40 pb-32 min-h-[80vh]">
        <div className="mx-auto max-w-md flex flex-col items-center text-center gap-8">
          <span className="eyebrow text-gold">Feedback</span>
          <h1 className="font-display uppercase text-bone text-[clamp(2rem,6vw,3rem)] leading-[1.05]">
            How was your piece?
          </h1>
          <p className="font-serif italic text-bone-dim text-lg leading-relaxed">
            Order {orderNumber}. Rate it from 1 to 5 and leave a line if you want — we read every reply.
          </p>
          <FeedbackForm orderNumber={orderNumber} />
        </div>
      </section>
      <Footer />
    </>
  );
}
