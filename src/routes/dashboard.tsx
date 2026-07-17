import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Plus, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, AlertCircle,
  Copy, TrendingUp,
} from "lucide-react";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { AppButton } from "@/components/site/app-button";
import { useApp, shortAddr, NETWORKS, type Network } from "@/lib/app-state";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — SecureEscrow" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { wallet, network, setNetwork } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wallet) { navigate({ to: "/" }); return; }
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, [wallet, navigate]);

  if (!wallet) return null;

  const balances: Record<Network, number> = { ethereum: 12480.42, bnb: 3204.19, tron: 890.00 };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Dashboard</div>
            <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Welcome back</h1>
            <button
              onClick={() => { navigator.clipboard?.writeText(wallet); toast.success("Address copied"); }}
              className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-xs text-muted-foreground transition hover:text-foreground"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald" />
              {shortAddr(wallet)}
              <Copy className="h-3 w-3" />
            </button>
          </div>
          <Link to="/create-escrow">
            <AppButton leftIcon={<Plus className="h-4 w-4" />}>Create Escrow</AppButton>
          </Link>
        </motion.div>

        {/* Network tabs */}
        <div className="mt-8">
          <div className="glass-card inline-flex gap-1 p-1">
            {NETWORKS.map((n) => (
              <button
                key={n.id}
                onClick={() => setNetwork(n.id)}
                className="relative rounded-lg px-4 py-2 text-sm font-medium transition"
              >
                {network === n.id && (
                  <motion.div layoutId="net-tab" className="absolute inset-0 rounded-lg bg-primary/20 ring-1 ring-primary/40" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                )}
                <span className={`relative ${network === n.id ? "text-foreground" : "text-muted-foreground"}`}>{n.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Balance + summary */}
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <motion.div layout className="glass-card relative overflow-hidden p-7 lg:col-span-2">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">USDT Balance · {NETWORKS.find(n => n.id === network)?.label}</div>
              <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-[10px] font-semibold text-emerald">LIVE</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={network} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-3">
                {loading ? (
                  <div className="skeleton h-11 w-64" />
                ) : (
                  <div className="font-display text-4xl font-bold sm:text-5xl">
                    ${balances[network].toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                    <span className="text-lg text-muted-foreground">USDT</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            <div className="mt-2 inline-flex items-center gap-1 text-xs text-emerald">
              <TrendingUp className="h-3 w-3" /> +2.4% this week
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/create-escrow"><AppButton leftIcon={<Plus className="h-4 w-4" />}>Create Escrow</AppButton></Link>
              <AppButton variant="outline" onClick={() => toast("Deposit is UI-only in this demo")}>Deposit</AppButton>
              <AppButton variant="outline" onClick={() => toast("Withdraw is UI-only in this demo")}>Withdraw</AppButton>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { label: "Active Escrows", value: 3, icon: Clock, tone: "text-primary bg-primary/15" },
              { label: "Completed", value: 27, icon: CheckCircle2, tone: "text-emerald bg-emerald/15" },
              { label: "Pending", value: 1, icon: AlertCircle, tone: "text-yellow-400 bg-yellow-400/10" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                whileHover={{ y: -2 }}
                className="glass-card flex items-center gap-4 p-5"
              >
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${s.tone}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="font-display text-2xl font-bold">{loading ? <span className="skeleton inline-block h-6 w-10" /> : s.value}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Recent Activity</h2>
            <button className="text-xs text-muted-foreground hover:text-foreground">View all</button>
          </div>
          <div className="glass-card divide-y divide-white/5 overflow-hidden">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <div className="skeleton h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3 w-40" />
                      <div className="skeleton h-3 w-24" />
                    </div>
                    <div className="skeleton h-4 w-16" />
                  </div>
                ))
              : MOCK_TX.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                    className="flex items-center gap-4 p-4"
                  >
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${t.dir === "in" ? "bg-emerald/15 text-emerald" : "bg-primary/15 text-primary"}`}>
                      {t.dir === "in" ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{t.label}</div>
                      <div className="truncate font-mono text-xs text-muted-foreground">{t.counterparty} · {t.time}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${t.dir === "in" ? "text-emerald" : ""}`}>
                        {t.dir === "in" ? "+" : "-"}${t.amount.toLocaleString()} USDT
                      </div>
                      <StatusBadge status={t.status} />
                    </div>
                  </motion.div>
                ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function StatusBadge({ status }: { status: "completed" | "pending" | "active" }) {
  const m = {
    completed: "bg-emerald/15 text-emerald",
    pending: "bg-yellow-400/10 text-yellow-400",
    active: "bg-primary/15 text-primary",
  } as const;
  return <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${m[status]}`}>{status}</span>;
}

const MOCK_TX = [
  { id: "1", label: "Escrow #A34B released", counterparty: "0x8f2a...A17c", amount: 2500, dir: "out", time: "2m ago", status: "completed" as const },
  { id: "2", label: "Escrow funded", counterparty: "0x92cd...11de", amount: 890, dir: "out", time: "1h ago", status: "active" as const },
  { id: "3", label: "Payment received", counterparty: "0xabf2...0093", amount: 1500, dir: "in", time: "5h ago", status: "completed" as const },
  { id: "4", label: "Escrow #B12F pending", counterparty: "0x7712...2244", amount: 4200, dir: "out", time: "1d ago", status: "pending" as const },
  { id: "5", label: "Payment received", counterparty: "0x3f10...ee89", amount: 320, dir: "in", time: "3d ago", status: "completed" as const },
];
