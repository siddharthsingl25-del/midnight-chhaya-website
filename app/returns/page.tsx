import type { Metadata } from "next";
import PageHeader from "@/components/sections/PageHeader";
import PolicyContent, { type PolicyBlock } from "@/components/sections/PolicyContent";
import Footer from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "Refund, Return & Exchange Policy",
  description:
    "Midnight Chhaya's official policy on refunds, returns, and exchanges — including mandatory unboxing video requirements.",
};

const blocks: PolicyBlock[] = [
  {
    type: "p",
    text:
      "At Midnight Chhaya, customer satisfaction is important to us, and we strive to deliver every order in perfect condition. While we understand that issues may occasionally arise, our refund, return, and exchange policy is designed to ensure fairness for both our customers and our business.",
  },
  {
    type: "p",
    text:
      "Please read the following policy carefully before placing your order.",
  },

  { type: "h", text: "Refunds, Returns & Exchanges" },
  {
    type: "p",
    text:
      "Refunds, returns, and exchanges are available only under the conditions mentioned below. Any request that does not meet these conditions may be declined.",
  },
  {
    type: "p",
    text:
      "Once an order has been successfully delivered, it is not eligible for return or refund. In eligible cases, only a replacement/exchange may be provided after verification. No monetary refund, wallet credit, or store credit will be issued.",
  },
  { type: "p", text: "An exchange may only be considered if:" },
  {
    type: "list",
    items: [
      "You receive a damaged product during transit.",
      "You receive an incorrect product.",
      "You receive a manufacturing-defective product.",
    ],
  },

  { type: "h", text: "Mandatory Unboxing Video" },
  {
    type: "p",
    text:
      "To request an exchange, you must contact us within 48 hours of delivery and provide a single continuous, unedited unboxing video.",
  },
  { type: "p", text: "The video must clearly show:" },
  {
    type: "list",
    items: [
      "The parcel from all sides before opening.",
      "The shipping label.",
      "That the package is completely sealed and unopened.",
      "The entire unboxing process without any cuts, pauses, edits, or transitions.",
      "The product and all contents immediately after opening.",
    ],
  },
  {
    type: "p",
    text:
      "Edited videos, shortened clips, recordings made after opening the parcel, or videos that do not clearly show the sealed package will not be accepted as proof.",
  },
  {
    type: "p",
    text:
      "Photos may be requested as supporting evidence but cannot replace the mandatory unboxing video.",
  },

  { type: "h", text: "Missing Items" },
  {
    type: "p",
    text:
      "If you believe an item is missing from your package, a valid continuous unboxing video is required.",
  },
  {
    type: "p",
    text:
      "Missing item claims without the required proof cannot be processed.",
  },
  {
    type: "p",
    text:
      "Approved claims are eligible only for a replacement (where applicable). Refunds will not be provided for missing items.",
  },

  { type: "h", text: "Battery-Powered Products" },
  {
    type: "p",
    text:
      "For hygiene, safety, and electronic handling reasons, products containing batteries — including earphones, earbuds, wireless audio devices, rechargeable accessories, and similar electronic products — are not eligible for refund, return, or exchange, except where required by applicable law.",
  },

  { type: "h", text: "Non-Eligible Cases" },
  { type: "p", text: "Requests will not be accepted if:" },
  {
    type: "list",
    items: [
      "The claim is made after 48 hours of delivery.",
      "The product has been used, worn, washed, altered, or damaged after delivery.",
      "Original packaging, accessories, manuals, or tags are missing.",
      "The mandatory unboxing video is not provided.",
      "The issue is caused by misuse, negligence, or normal wear and tear.",
      "The request is based on a change of mind, incorrect order, or personal preference.",
    ],
  },

  { type: "h", text: "Customized Products" },
  {
    type: "p",
    text:
      "Customized, personalized, or made-to-order products are strictly non-returnable, non-refundable, and non-exchangeable.",
  },

  { type: "h", text: "Verification & Fraud Prevention" },
  {
    type: "p",
    text:
      "All claims are subject to verification by our quality team. Midnight Chhaya reserves the right to approve or reject any request based on the evidence provided.",
  },
  {
    type: "p",
    text:
      "Fraudulent, misleading, incomplete, or manipulated claims may be rejected, and future orders from the same customer may also be refused.",
  },

  { type: "h", text: "Acceptance of Policy" },
  {
    type: "p",
    text:
      "By placing an order with Midnight Chhaya, you acknowledge that you have read, understood, and agreed to this Refund, Return & Exchange Policy.",
  },
];

export default function ReturnsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Policies"
        title="Refund, Return & Exchange Policy"
        lede="Please read carefully before placing your order — this policy governs every purchase."
      />
      <PolicyContent blocks={blocks} />
      <Footer />
    </>
  );
}
