import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Check, Plus, ArrowRight, Sparkles } from "lucide-react";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { AppButton } from "@/components/site/app-button";
import { useApp, shortAddr, NETWORKS } from "@/lib/app-state";

export const Route = createFileRoute("/success")({
  head: () => ({ meta: [{ title: "Success — SecureEscrow" }] }),
  component: SuccessPage,
});

function SuccessPage() {
  const { wallet, currentEscrow, setCurrentEscrow } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!wallet) navigate({ to: "/" });
  }, [wallet, navigate]);

  return (
    <>
      <Navbar />
      <main className="mx-auto flex min-h-[72vh] max-w-2xl flex-col items-center justify-center px-4 py-14 text-center sm:px-6">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 16 }}
          className="relative"
        >
          <div className="absolute inset-0 -z-10 animate-ping rounded-full bg-emerald/25" />
          <div className="glow-emerald grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-emerald/40 to-emerald/10 ring-1 ring-emerald/30">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.25, type: "spring", stiffness: 260, damping: 15 }}>
              <Check className="h-14 w-14 text-emerald" strokeWidth={3} />
            </motion.div>
          </div>
          {/* sparkles */}
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], x: [0, (i - 2) * 40], y: [0, -30 - i * 8] }}
              transition={{ duration: 1.4, delay: 0.5 + i * 0.08, repeat: Infinity, repeatDelay: 2 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald"
            >
              <Sparkles className="h-4 w-4" />
            </motion.div>
          ))}
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-8 font-display text-3xl font-bold sm:text-4xl">
          <span className="text-gradient">Funds Released Successfully</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          Your escrow has been completed successfully. The seller has received the funds.
        </motion.p>

        {currentEscrow && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="glass-card mt-8 w-full max-w-md p-5 text-left">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Escrow #{currentEscrow.id}</span>
              <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-[10px] font-semibold text-emerald">COMPLETED</span>
            </div>
            <div className="mt-3 font-display text-3xl font-bold">
              {Number(currentEscrow.amount).toLocaleString()} <span className="text-base text-muted-foreground">USDT</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div><div className="text-muted-foreground">Buyer</div><div className="mt-0.5 font-mono">{shortAddr(currentEscrow.buyer)}</div></div>
              <div><div className="text-muted-foreground">Seller</div><div className="mt-0.5 font-mono">{shortAddr(currentEscrow.seller)}</div></div>
              <div><div className="text-muted-foreground">Network</div><div className="mt-0.5">{NETWORKS.find(n => n.id === currentEscrow.network)!.label}</div></div>
              <div><div className="text-muted-foreground">Completed</div><div className="mt-0.5">Just now</div></div>
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="mt-8 flex flex-wrap justify-center gap-2">
          <Link to="/dashboard" onClick={() => setCurrentEscrow(null)}>
            <AppButton variant="outline" leftIcon={<ArrowRight className="h-4 w-4" />}>Return to Dashboard</AppButton>
          </Link>
          <Link to="/create-escrow" onClick={() => setCurrentEscrow(null)}>
            <AppButton variant="success" leftIcon={<Plus className="h-4 w-4" />}>Create New Escrow</AppButton>
          </Link>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
