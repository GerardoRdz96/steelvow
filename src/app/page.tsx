import Link from "next/link";
import { AttributionFooter } from "@/components/layout/attribution-footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-extrabold tracking-tight text-slate-900">
          Steel<span className="text-orange-600">vow</span>
        </span>
        <Link
          href="/auth/login"
          prefetch={true}
          className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <main className="px-6 pt-16 pb-24 max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
          OSHA Compliance
          <br />
          <span className="text-orange-600">Made Simple</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-concrete-600 max-w-2xl mx-auto">
          Daily inspections, incident reports, and safety documentation for
          construction crews. Works offline. Available in English and Spanish.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/login"
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors min-h-[56px]"
          >
            Start Free Trial
          </Link>
          <span className="text-sm text-concrete-600">
            14 days free &middot; No credit card
          </span>
        </div>

        {/* Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left">
          <ValueCard
            title="Offline-First"
            description="Complete inspections on job sites with no internet. Data syncs automatically when you're back online."
          />
          <ValueCard
            title="OSHA 300 Logs"
            description="Auto-generate OSHA 300, 300A, and 301 forms from your incident reports. Export-ready."
          />
          <ValueCard
            title="AI Safety Programs"
            description="Generate written safety programs (Fall Protection, Hazcom, LOTO) customized to your company."
          />
        </div>

        {/* Pricing Preview */}
        <div className="mt-20">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-8">
            Simple, flat pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PriceCard
              tier="Starter"
              price="$49"
              features={[
                "Up to 10 workers",
                "3 projects",
                "Core compliance tools",
              ]}
            />
            <PriceCard
              tier="Pro"
              price="$99"
              features={[
                "Up to 30 workers",
                "Unlimited projects",
                "AI safety programs",
              ]}
              highlighted
            />
            <PriceCard
              tier="Business"
              price="$199"
              features={[
                "Up to 50 workers",
                "OSHA 300 auto-filing",
                "API access",
              ]}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-6">
        <AttributionFooter />
      </footer>
    </div>
  );
}

function ValueCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-concrete-600">{description}</p>
    </div>
  );
}

function PriceCard({
  tier,
  price,
  features,
  highlighted = false,
}: {
  tier: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        highlighted
          ? "border-orange-400 bg-orange-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-sm font-semibold text-concrete-600">{tier}</p>
      <p className="text-3xl font-extrabold text-slate-900 mt-2">
        {price}
        <span className="text-sm font-normal text-concrete-600">/mo</span>
      </p>
      <ul className="mt-4 space-y-2">
        {features.map((f) => (
          <li key={f} className="text-sm text-slate-700 flex items-center gap-2">
            <span className="text-success">&#10003;</span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
