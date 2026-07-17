import { Shield, Twitter, Github, Send } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/5 bg-background/40 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="glow-primary flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet">
                <Shield className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display text-lg font-bold">SecureEscrow</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Trustless P2P USDT escrow. Non-custodial, transparent, and settled in seconds across multiple chains.
            </p>
            <div className="mt-5 flex gap-2">
              {[Twitter, Github, Send].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="glass-card grid h-9 w-9 place-items-center rounded-xl transition hover:brightness-125"
                  aria-label="social"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <FooterCol title="Product" items={[
            { label: "Home", to: "/" },
            { label: "Features", href: "/#features" },
            { label: "How it works", href: "/#how-it-works" },
            { label: "FAQ", href: "/#faq" },
          ]} />
          <FooterCol title="Company" items={[
            { label: "Contact", href: "#" },
            { label: "Privacy", href: "#" },
            { label: "Terms", href: "#" },
          ]} />
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} SecureEscrow. All rights reserved.</p>
          <p className="font-mono">Demo UI — no real transactions.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: { label: string; to?: string; href?: string }[] }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h4>
      <ul className="space-y-2 text-sm">
        {items.map((it) =>
          it.to ? (
            <li key={it.label}><Link to={it.to} className="transition hover:text-foreground">{it.label}</Link></li>
          ) : (
            <li key={it.label}><a href={it.href} className="transition hover:text-foreground">{it.label}</a></li>
          ),
        )}
      </ul>
    </div>
  );
}
