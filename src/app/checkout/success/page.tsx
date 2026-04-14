import Link from "next/link";

export const metadata = { title: "Order received" };

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4">
        Thank you
      </p>
      <h1 className="font-serif text-4xl md:text-5xl">Your painting is on its way.</h1>
      <p className="mt-6 text-muted-foreground leading-relaxed">
        You&rsquo;ll receive a confirmation email from Stripe with your
        receipt. Barbara will be in touch within a day or two to let you
        know when your piece ships from the studio.
      </p>
      <div className="mt-10">
        <Link
          href="/gallery"
          className="inline-flex items-center px-6 py-3 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          Return to the gallery
        </Link>
      </div>
    </div>
  );
}
