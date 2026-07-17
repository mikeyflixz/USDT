import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Shield, Wallet, LogOut } from "lucide-react";
import { useState } from "react";
import { useApp, shortAddr } from "@/lib/app-state";
import { AppButton } from "./app-button";
import { ConnectWalletModal } from "./connect-wallet-modal";

export function Navbar() {
  const { wallet, disconnect } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-40 border-b border-white/5 bg-background/60 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="group flex items-center gap-2.5">
            <div className="glow-primary flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet">
              <Shield className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-base font-bold tracking-tight">SecureEscrow</span>
              <span className="text-[10px] font-medium text-muted-foreground">Trustless P2P USDT</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <Link to="/" className="transition hover:text-foreground">Home</Link>
            <a href="/#features" className="transition hover:text-foreground">Features</a>
            <a href="/#how-it-works" className="transition hover:text-foreground">How it works</a>
            {wallet && (
              <Link to="/dashboard" className="transition hover:text-foreground" activeProps={{ className: "text-foreground" }}>
                Dashboard
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {wallet ? (
              <>
                <div className="glass-card hidden items-center gap-2 rounded-full px-3.5 py-1.5 text-xs sm:flex">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald" />
                  <span className="font-mono">{shortAddr(wallet)}</span>
                </div>
                <AppButton variant="ghost" size="sm" onClick={disconnect} leftIcon={<LogOut className="h-4 w-4" />}>
                  <span className="hidden sm:inline">Disconnect</span>
                </AppButton>
              </>
            ) : (
              <AppButton size="sm" leftIcon={<Wallet className="h-4 w-4" />} onClick={() => setOpen(true)}>
                Connect Wallet
              </AppButton>
            )}
          </div>
        </div>
      </motion.header>
      <ConnectWalletModal open={open} onOpenChange={setOpen} />
    </>
  );
}
