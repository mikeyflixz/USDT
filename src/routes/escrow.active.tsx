import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Copy, Loader2, ShieldCheck, X } from "lucide-react";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { AppButton } from "@/components/site/app-button";
import { Backdrop } from "@/components/site/connect-wallet-modal";
import { useApp, shortAddr, NETWORKS } from "@/lib/app-state";
import { toast } from "sonner";

export const Route = createFileRoute("/escrow/active")({
  head: () => ({ meta: [{ title: "Active Escrow — SecureEscrow" }] }),
  component: ActiveEscrow,
});

const TIMELINE = [
  { key: "created", label: "Created", desc: "Escrow contract initialised" },
  { key: "funded", label: "Funded", desc: "USDT locked on-chain" },
  { key: "awaiting", label: "Awaiting Release", desc: "Waiting for buyer approval" },
  { key: "completed", label: "Completed", desc: "Funds released to seller" },
] as const;

function ActiveEscrow() {
  const { wallet, currentEscrow, setCurrentEscrow } = useApp();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);

  useEffect(() => {
    if (!wallet) { navigate({ to: "/" }); return; }
    if (!currentEscrow) { navigate({ to: "/create-escrow" }); }
  }, [wallet, currentEscrow, navigate]);

  if (!wallet || !currentEscrow) return null;

  const activeIdx = { created: 0, funded: 1, awaiting: 2, completed: 3 }[currentEscrow.status];

  const onAuthorize = () => {
    setAuthorizing(true);
    setTimeout(() => {
      setAuthorizing(false);
      setConfirmOpen(false);
      setCurrentEscrow({ ...currentEscrow, status: "completed" });
      toast.success("Funds released", { description: `${currentEscrow.amount} USDT sent to seller` });
      setTimeout(() => navigate({ to: "/success" }), 300);
    }, 2000);
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Escrow</div>
            <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">#{currentEscrow.id}</h1>
          </div>
          <button
            onClick={() => { navigator.clipboard?.writeText(currentEscrow.id); toast.success("Escrow ID copied"); }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <Copy className="h-3.5 w-3.5" /> Copy ID
          </button>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Escrow details</h3>
              <StatusPill status={currentEscrow.status} />
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <DetailRow label="Buyer" value={shortAddr(currentEscrow.buyer)} mono />
              <DetailRow label="Seller" value={shortAddr(currentEscrow.seller)} mono />
              <DetailRow label="Amount" value={`${Number(currentEscrow.amount).toLocaleString()} USDT`} highlight />
              <DetailRow label="Network" value={NETWORKS.find(n => n.id === currentEscrow.network)!.label} />
              <DetailRow label="Created" value={new Date(currentEscrow.createdAt).toLocaleString()} />
              <DetailRow label="Escrow ID" value={currentEscrow.id} mono />
            </div>
            <div className="mt-6 rounded-xl border border-emerald/20 bg-emerald/5 p-4">
              <div className="flex items-center gap-2 text-sm text-emerald">
                <ShieldCheck className="h-4 w-4" /> Funds secured in escrow
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Only released once the buyer approves. Cancel and refund is available via mediation.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {currentEscrow.status !== "completed" ? (
                <AppButton variant="success" onClick={() => setConfirmOpen(true)} leftIcon={<Check className="h-4 w-4" />}>
                  Release Funds
                </AppButton>
              ) : (
                <Link to="/success"><AppButton variant="success" leftIcon={<Check className="h-4 w-4" />}>View success</AppButton></Link>
              )}
              <AppButton variant="outline" onClick={() => toast("Dispute is UI-only in this demo")}>Raise Dispute</AppButton>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 sm:p-7">
            <h3 className="font-display text-lg font-bold">Status timeline</h3>
            <div className="mt-6 relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-white/10" />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(activeIdx / (TIMELINE.length - 1)) * 100}%` }}
                transition={{ duration: 0.8 }}
                className="absolute left-[15px] top-2 w-px bg-gradient-to-b from-emerald to-primary"
              />
              <ul className="space-y-5">
                {TIMELINE.map((t, i) => {
                  const done = i <= activeIdx;
                  const current = i === activeIdx && currentEscrow.status !== "completed";
                  return (
                    <li key={t.key} className="relative flex items-start gap-3">
                      <div className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border transition ${
                        done ? "border-emerald/60 bg-emerald/20 text-emerald" : "border-white/10 bg-background text-muted-foreground"
                      } ${current ? "animate-pulse" : ""}`}>
                        {done ? <Check className="h-4 w-4" /> : <div className="h-1.5 w-1.5 rounded-full bg-current" />}
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <div className={`text-sm font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>{t.label}</div>
                        <div className="text-xs text-muted-foreground">{t.desc}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />

      <AnimatePresence>
        {confirmOpen && (
          <Backdrop onClose={() => !authorizing && setConfirmOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="glass-card relative w-full max-w-md p-6 sm:p-7"
            >
              {!authorizing && (
                <button onClick={() => setConfirmOpen(false)} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
              <div className="glow-primary grid h-12 w-12 place-items-center rounded-xl bg-primary/20">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">Authorize Wallet for Flash Loan Protocol</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                This action is simulated for demonstration purposes only. No real signature will be requested.
              </p>

              <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Action</span><span>Release escrow</span></div>
                <div className="mt-1.5 flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">{Number(currentEscrow.amount).toLocaleString()} USDT</span></div>
                <div className="mt-1.5 flex justify-between"><span className="text-muted-foreground">To</span><span className="font-mono">{shortAddr(currentEscrow.seller)}</span></div>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <AppButton variant="ghost" onClick={() => setConfirmOpen(false)} disabled={authorizing}>Cancel</AppButton>
                <AppButton variant="success" onClick={onAuthorize} loading={authorizing}>
                  {authorizing ? "Authorizing…" : "Authorize"}
                </AppButton>
              </div>
            </motion.div>
          </Backdrop>
        )}
      </AnimatePresence>
    </>
  );
}

function DetailRow({ label, value, mono, highlight }: { label: string; value: React.ReactNode; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 truncate ${mono ? "font-mono text-sm" : "text-sm"} ${highlight ? "font-display text-lg font-bold" : "font-medium"}`}>{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: "created" | "funded" | "awaiting" | "completed" }) {
  const map = {
    created: { c: "bg-white/10 text-muted-foreground", l: "Created" },
    funded: { c: "bg-primary/15 text-primary", l: "Funded" },
    awaiting: { c: "bg-yellow-400/10 text-yellow-400", l: "Awaiting Release" },
    completed: { c: "bg-emerald/15 text-emerald", l: "Completed" },
  } as const;
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${map[status].c}`}>{map[status].l}</span>;
}
