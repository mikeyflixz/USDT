// @ts-nocheck
import { AnimatePresence, motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApp, shortAddr } from "@/lib/app-state";
import { connectWallet } from "@/lib/web3";

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

  const handleSelect = async (id: string, name: string) => {
    setSelected(id);
    setStage("connecting");
    try {
      const result = await connectWallet();
      setStage("success");
      connect(result.address, result.signer);
      toast.success("Wallet connected", { description: `${name} · ${shortAddr(result.address)}` });
      setTimeout(() => {
        onOpenChange(false);
        onConnected?.();
        setTimeout(() => { setStage("select"); setSelected(null); }, 300);
      }, 900);
    } catch (err: any) {
      toast.error(err.message || "Connection failed");
      setStage("select");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <Backdrop onClose={stage === "select" ? () => onOpenChange(false) : () => {}}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0f] p-6 shadow-2xl"
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
                <h3 className="text-lg font-semibold text-white">Connect a wallet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Choose your preferred wallet to continue.</p>
                <div className="mt-5 flex flex-col gap-2.5">
                  {WALLETS.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => handleSelect(w.id, w.name)}
                      className="group flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 text-left transition hover:border-primary/40 hover:bg-white/[0.04]"
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${w.color} text-sm font-bold text-white`}>
                        {w.initial}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{w.name}</div>
                        <div className="text-xs text-muted-foreground">{w.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="mt-6 text-center text-xs text-muted-foreground">By connecting, you agree to our Terms and Privacy Policy.</p>
              </>
            )}

            {stage === "connecting" && (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <h3 className="mt-4 text-lg font-semibold text-white">Connecting…</h3>
                <p className="mt-1 text-sm text-muted-foreground">Approve the connection in {WALLETS.find((w) => w.id === selected)?.name}</p>
              </div>
            )}

            {stage === "success" && (
              <div className="flex flex-col items-center py-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
                  <Check className="h-7 w-7 text-emerald-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">Connected</h3>
                <p className="mt-1 font-mono text-sm text-muted-foreground">{shortAddr("0x71C7656EC7ab88b098defB751B7401B5f6d8976F")}</p>
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
        {children}
      </div>
    </motion.div>
  );
}