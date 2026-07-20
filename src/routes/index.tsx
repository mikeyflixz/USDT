import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  Shield, Zap, Globe, Eye, Wallet, ArrowRight, CheckCircle2,
  Lock, TrendingUp, Users, Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { AppButton } from "@/components/site/app-button";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate({ to: "/create-escrow" });
  };

  return (
    <>
      <Navbar />
      <main>
        <Hero onGetStarted={handleGetStarted} />
        <StatsBar />
        <HowItWorks />
        <Features />
        <CTASection onGetStarted={handleGetStarted} />
      </main>
      <Footer />
    </>
  );
}

function Hero({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="relative mx-auto max-w-7xl px-4 pt-14 pb-16 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-emerald" />
            <span className="text-muted-foreground">Non-custodial · Multi-chain · Instant</span>
          </div>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-gradient">Trustless P2P</span>
            <br />
            USDT Escrow.
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            SecureEscrow lets buyers and sellers move USDT with confidence. Funds
            are locked on-chain until both sides are satisfied — no middlemen,
            no delays, no doubts.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <AppButton size="lg" onClick={onGetStarted} rightIcon={<ArrowRight className="h-4 w-4" />}>
              Get Started
            </AppButton>
            <AppButton size="lg" variant="outline" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
              Learn More
            </AppButton>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {["No smart-contract risk", "Audited flow", "0 custody"].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald" /> {t}
              </div>
            ))}
          </div>
        </motion.div>

        <HeroMockup />
      </div>
    </section>
  );
}

function HeroMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15 }}
      className="relative"
    >
      <div className="glow-primary glass-card relative rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald/70" />
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            escrow.secure/dashboard
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-white/5 bg-gradient-to-br from-primary/15 via-transparent to-violet/15 p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Escrow balance</span>
            <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-[10px] font-semibold text-emerald">ACTIVE</span>
          </div>
          <div className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            <AnimatedCount to={12480} prefix="$" />{" "}
            <span className="text-base text-muted-foreground">USDT</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <motion.div initial={{ width: 0 }} animate={{ width: "68%" }} transition={{ duration: 1.4, delay: 0.4 }} className="h-full rounded-full bg-gradient-to-r from-primary to-emerald" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { l: "Buyer", v: "0x71C7...F3b2" },
            { l: "Seller", v: "0x8f2a...A17c" },
            { l: "Network", v: "Ethereum" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</div>
              <div className="mt-1 truncate font-mono text-xs">{s.v}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {[
            { l: "Created", d: true },
            { l: "Funded", d: true },
            { l: "Awaiting release", d: true, active: true },
            { l: "Completed", d: false },
          ].map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-3 text-xs"
            >
              <div className={`grid h-6 w-6 place-items-center rounded-full ${s.d ? "bg-emerald/20 text-emerald" : "bg-white/5 text-muted-foreground"} ${s.active ? "animate-pulse" : ""}`}>
                {s.d ? <CheckCircle2 className="h-3.5 w-3.5" /> : <div className="h-1.5 w-1.5 rounded-full bg-current" />}
              </div>
              <span className={s.d ? "text-foreground" : "text-muted-foreground"}>{s.l}</span>
              {s.active && <span className="ml-auto text-[10px] text-emerald">in progress</span>}
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, rotate: -6 }}
        animate={{ opacity: 1, y: 0, rotate: -6 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="glass-card absolute -bottom-6 -left-6 hidden w-52 rotate-[-6deg] p-3.5 sm:block"
      >
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald/20 text-emerald">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold">Payment released</div>
            <div className="truncate text-[10px] text-muted-foreground">2,500 USDT · just now</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20, rotate: 5 }}
        animate={{ opacity: 1, y: 0, rotate: 5 }}
        transition={{ delay: 0.65, duration: 0.6 }}
        className="glass-card absolute -top-4 -right-4 hidden w-44 rotate-[5deg] p-3.5 sm:block"
      >
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">This month</div>
        <div className="mt-1 font-display text-lg font-bold">+18.4%</div>
        <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald">
          <TrendingUp className="h-3 w-3" /> volume growth
        </div>
      </motion.div>
    </motion.div>
  );
}

function AnimatedCount({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number; const start = performance.now(); const dur = 1400;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <span>{prefix}{val.toLocaleString()}{suffix}</span>;
}

function StatsBar() {
  const stats = [
    { label: "Transactions", value: 50000, suffix: "+", icon: TrendingUp },
    { label: "Users", value: 10000, suffix: "+", icon: Users },
    { label: "Networks", value: 3, suffix: "", icon: Globe },
    { label: "Settlement", value: 0, custom: "Instant", icon: Zap },
  ];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <section ref={ref} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="glass-card grid grid-cols-2 gap-6 p-6 sm:p-8 md:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-3"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-2xl font-bold">
                {s.custom ? s.custom : (inView ? <AnimatedCount to={s.value} suffix={s.suffix} /> : "0")}
              </div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: Wallet, title: "Connect Wallet", desc: "Sign in with MetaMask, WalletConnect, or Coinbase Wallet in one click.", tone: "from-primary/25 to-primary/5" },
    { icon: Lock, title: "Fund Escrow", desc: "Lock USDT on-chain. Neither party can move it without agreement.", tone: "from-violet/25 to-violet/5" },
    { icon: CheckCircle2, title: "Release Payment", desc: "Approve release with a single click. Funds arrive instantly.", tone: "from-emerald/25 to-emerald/5" },
  ];
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8">
      <SectionHeader eyebrow="How it works" title="Three steps to safe P2P payments" />
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={{ y: -4 }}
            className={`glass-card relative overflow-hidden p-7 bg-gradient-to-br ${s.tone}`}
          >
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/5 backdrop-blur">
                <s.icon className="h-6 w-6" />
              </div>
              <span className="font-display text-4xl font-bold text-white/10">0{i + 1}</span>
            </div>
            <h3 className="mt-6 font-display text-xl font-bold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const feats = [
    { icon: Shield, title: "Secure Escrow", desc: "Battle-tested on-chain locking with zero custodial risk." },
    { icon: Globe, title: "Multi-chain Ready", desc: "Ethereum, BNB Chain and Tron supported today." },
    { icon: Zap, title: "Fast Settlement", desc: "Release funds instantly the moment both parties agree." },
    { icon: Eye, title: "Transparent Process", desc: "Every step recorded, every action verifiable on-chain." },
  ];
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8">
      <SectionHeader eyebrow="Features" title="Built for serious peer-to-peer" />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {feats.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className="glass-card group relative overflow-hidden p-6"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/25 to-violet/25 text-primary">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 font-display text-base font-bold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-opacity duration-500 group-hover:bg-primary/25" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CTASection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="glass-card relative overflow-hidden p-8 text-center sm:p-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,oklch(0.68_0.18_250_/_18%),transparent_60%)]" />
        <div className="relative">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            <span className="text-gradient">Ready to escrow?</span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
            Spin up a secure escrow in under a minute. No signups, no custody, no hidden fees.
          </p>
          <div className="mt-7 flex justify-center">
            <AppButton size="lg" onClick={onGetStarted} rightIcon={<ArrowRight className="h-4 w-4" />}>
              Launch App
            </AppButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mx-auto max-w-2xl text-center"
    >
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</div>
      <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{title}</h2>
    </motion.div>
  );
}
