import { AnimatePresence, motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApp, MOCK_WALLET, shortAddr } from "@/lib/app-state";

const WALLETS = [
  { id: "metamask", name: "MetaMask", desc: "Most popular · Recommended", color: "from-orange-500 to-yellow-500", initial: "M" },
  { id: "walletconnect", name: "WalletConnect", desc: "Scan with mobile wallet", color: "from-blue-500 to-cyan-500", initial: "W" },
  { id: "coinbase", name: "Coinbase Wallet", desc: "Coinbase official", color: "from-blue-600 to-indigo-600", initial: "C" },
];

type Stage = "select" | "connecting" | "success";

export function ConnectWalletModal({ open, onOpenChange, onConnected }: { open: boolean; onOpenChange: (o: boolean) => void; onConnected?: () => void }) {
  const { connect } = useApp();
  const [stage, setStage] = useState<Stage>("select");
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string, name: string) => {
    setSelected(id);
    setStage("connecting");
    setTimeout(() => {
      setStage("success");
      connect(MOCK_WALLET);
      toast.success("Wallet connected", { description: `${name} · ${shortAddr(MOCK_WALLET)}` });
      setTimeout(() => {
        onOpenChange(false);
        onConnected?.();
        setTimeout(() => { setStage("select"); setSelected(null); }, 300);
      }, 900);
    }, 2000);
  };

  return (
    <AnimatePresence>
      {open && (
        <Backdrop onClose={() => stage === "select" && onOpenChange(false)}>
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="glass-card relative w-full max-w-md p-6 sm:p-7"
          >
            {stage === "select" && (
              <button
                onClick={() => onOpenChange(false)}
                className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                aria-label="close"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {stage === "select" && (
              <>
                <h3 className="font-display text-xl font-bold">Connect a wallet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Choose your preferred wallet to continue.</p>
                <div className="mt-6 space-y-2.5">
                  {WALLETS.map((w, i) => (
                    <motion.button
                      key={w.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleSelect(w.id, w.name)}
                      className="group flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 text-left transition hover:border-primary/40 hover:bg-white/[0.04]"
                    >
                      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${w.color} font-bold text-white`}>
                        {w.initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold">{w.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{w.desc}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <p className="mt-5 text-center text-xs text-muted-foreground">
                  By connecting, you agree to our Terms and Privacy Policy.
                </p>
              </>
            )}

            {stage === "connecting" && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                  <div className="glow-primary relative grid h-16 w-16 place-items-center rounded-full bg-primary/20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                </div>
                <h3 className="mt-6 font-display text-lg font-bold">Connecting…</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Approve the connection in {WALLETS.find((w) => w.id === selected)?.name}
                </p>
              </div>
            )}

            {stage === "success" && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="glow-emerald grid h-16 w-16 place-items-center rounded-full bg-emerald/20"
                >
                  <Check className="h-9 w-9 text-emerald" strokeWidth={3} />
                </motion.div>
                <h3 className="mt-6 font-display text-lg font-bold">Connected</h3>
                <p className="mt-1 font-mono text-sm text-muted-foreground">{shortAddr(MOCK_WALLET)}</p>
              </div>
            )}
          </motion.div>
        </Backdrop>
      )}
    </AnimatePresence>
  );
}

export function Backdrop({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-md"
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
        {children}
      </div>
    </motion.div>
  );
}
