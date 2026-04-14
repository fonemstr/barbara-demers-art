import { CommissionsForm } from "@/components/commissions-form";

export const metadata = { title: "Commissions" };

export default function CommissionsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-12 max-w-2xl">
        <p className="text-sm tracking-[0.2em] uppercase text-muted-foreground mb-4">
          Commissions
        </p>
        <h1 className="font-serif text-4xl md:text-5xl">
          A painting of the one you love.
        </h1>
        <p className="mt-5 text-muted-foreground leading-relaxed">
          Barbara takes a small number of commissions each year —
          portraits of beloved pets, working animals, and wildlife. Share a
          few details and she&rsquo;ll be in touch to discuss size, medium,
          reference photos, and timeline.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <aside className="md:col-span-1 space-y-6 text-sm">
          <div>
            <p className="font-serif text-lg text-foreground">How it works</p>
            <ol className="mt-3 space-y-2 text-muted-foreground list-decimal list-inside">
              <li>You share your idea + reference photos</li>
              <li>Barbara quotes size, price, and timeline</li>
              <li>50% deposit holds your spot</li>
              <li>Progress photos at key milestones</li>
              <li>Final balance on completion; piece ships from the studio</li>
            </ol>
          </div>
          <div>
            <p className="font-serif text-lg text-foreground">Typical pricing</p>
            <ul className="mt-3 space-y-1 text-muted-foreground">
              <li>Small (12×16 in) — from $800</li>
              <li>Medium (16×20 in) — from $1,400</li>
              <li>Large (24×30 in) — from $2,400</li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Final price depends on complexity, subject, and number of
              figures.
            </p>
          </div>
        </aside>

        <div className="md:col-span-2">
          <CommissionsForm />
        </div>
      </div>
    </div>
  );
}
