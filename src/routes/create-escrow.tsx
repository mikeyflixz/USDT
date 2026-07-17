import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowLeft, User, Wallet, Coins, Network, Check, Loader2 } from "lucide-react";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { AppButton } from "@/components/site/app-button";
import { useApp, NETWORKS, shortAddr, type Network as Net } from "@/lib/app-state";
import { toast } from "sonner";

export const Route = createFileRoute("/create-escrow")({
  head: () => ({ meta: [{ title: "Create Escrow — SecureEscrow" }] }),
  component: CreateEscrow,
});

function CreateEscrow() {
  const { wallet, setCurrentEscrow } = useApp();
  const navigate = useNavigate();
  useEffect(() => { if (!wallet) navigate({ to: "/" }); }, [wallet, navigate]);

  const [step, setStep] = useState<1 | 2>(1);
  const [buyer, setBuyer] = useState("");
  const [seller, setSeller] = useState("");
  const [amount, setAmount] = useState("");
  const [network, setNetwork] = useState<Net>("ethereum");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [funding, setFunding] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    const addrRe = /^0x[a-fA-F0-9]{6,}$/;
    if (!buyer) e.buyer = "Buyer address is required";
    else if (!addrRe.test(buyer)) e.buyer = "Enter a valid address";
    if (!seller) e.seller = "Seller address is required";
    else if (!addrRe.test(seller)) e.seller = "Enter a valid address";
    else if (seller === buyer) e.seller = "Buyer and seller must differ";
    const n = Number(amount);
    if (!amount) e.amount = "Amount is required";
    else if (!Number.isFinite(n) || n <= 0) e.amount = "Amount must be positive";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onContinue = () => { if (validate()) setStep(2); };

  const onFund = () => {
    setFunding(true);
    setTimeout(() => {
      const id = "ESC-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      setCurrentEscrow({
        id, buyer, seller, amount: Number(amount).toFixed(2), network,
        status: "funded", createdAt: new Date().toISOString(),
      });
      toast.success("Escrow funded", { description: `${amount} USDT locked on ${NETWORKS.find(n => n.id === network)?.label}` });
      navigate({ to: "/escrow/active" });
    }, 1800);
  };

  if (!wallet) return null;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Create Escrow</h1>
        <p className="mt-2 text-sm text-muted-foreground">Lock USDT between two parties until both agree to release.</p>

        <StepIndicator step={step} />

        <div className="glass-card mt-8 overflow-hidden p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <Field
                  icon={<User className="h-4 w-4" />}
                  label="Buyer address" placeholder="0x..." value={buyer}
                  onChange={setBuyer} error={errors.buyer}
                />
                <Field
                  icon={<Wallet className="h-4 w-4" />}
                  label="Seller address" placeholder="0x..." value={seller}
                  onChange={setSeller} error={errors.seller}
                />
                <Field
                  icon={<Coins className="h-4 w-4" />}
                  label="Amount (USDT)" placeholder="0.00" value={amount}
                  onChange={setAmount} error={errors.amount} type="number" suffix="USDT"
                />
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Network className="mr-1 inline h-3.5 w-3.5" /> Network
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {NETWORKS.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => setNetwork(n.id)}
                        className={`rounded-xl border p-3 text-left transition ${network === n.id ? "border-primary/60 bg-primary/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}
                      >
                        <div className="text-sm font-semibold">{n.label}</div>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{n.symbol}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2 pt-3">
                  <Link to="/dashboard"><AppButton variant="ghost">Cancel</AppButton></Link>
                  <AppButton onClick={onContinue} rightIcon={<ArrowRight className="h-4 w-4" />}>Continue</AppButton>
                </div>
              </motion.div>
            ) : (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h3 className="font-display text-lg font-bold">Review escrow</h3>
                <p className="mt-1 text-sm text-muted-foreground">Confirm the details before funding.</p>
                <div className="mt-5 divide-y divide-white/5 rounded-xl border border-white/5">
                  <Row label="Buyer" value={shortAddr(buyer)} mono />
                  <Row label="Seller" value={shortAddr(seller)} mono />
                  <Row label="Amount" value={`${Number(amount).toLocaleString()} USDT`} highlight />
                  <Row label="Network" value={NETWORKS.find(n => n.id === network)!.label} />
                  <Row label="Status" value={<span className="rounded-full bg-yellow-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-yellow-400">Not funded</span>} />
                  <Row label="Estimated completion" value="~30 seconds after release" />
                </div>
                <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                  This is a UI demonstration. No real USDT will be transferred and no wallet approval will be requested.
                </div>
                <div className="mt-6 flex flex-wrap justify-between gap-2">
                  <AppButton variant="ghost" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="h-4 w-4" />} disabled={funding}>Back</AppButton>
                  <AppButton variant="success" onClick={onFund} loading={funding} leftIcon={!funding && <Check className="h-4 w-4" />}>
                    {funding ? "Funding escrow…" : "Fund Escrow"}
                  </AppButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </>
  );
}

function StepIndicator({ step }: { step: 1 | 2 }) {
  const steps = ["Details", "Review & Fund"];
  return (
    <div className="mt-8 flex items-center gap-3">
      {steps.map((s, i) => {
        const n = i + 1; const active = n === step; const done = n < step;
        return (
          <div key={s} className="flex items-center gap-3">
            <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition ${done ? "bg-emerald text-black" : active ? "bg-primary text-primary-foreground glow-primary" : "bg-white/5 text-muted-foreground"}`}>
              {done ? <Check className="h-4 w-4" /> : n}
            </div>
            <span className={`text-sm ${active || done ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
            {i < steps.length - 1 && <div className={`h-px w-8 sm:w-16 ${done ? "bg-emerald/60" : "bg-white/10"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function Field({
  icon, label, placeholder, value, onChange, error, type = "text", suffix,
}: {
  icon?: React.ReactNode; label: string; placeholder?: string; value: string;
  onChange: (v: string) => void; error?: string; type?: string; suffix?: string;
}) {
  const [focus, setFocus] = useState(false);
  const filled = value.length > 0;
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className={`group relative flex items-center gap-2 rounded-xl border bg-white/[0.02] px-3.5 py-3 transition ${
        error ? "border-destructive/60" : focus ? "border-primary/60 ring-2 ring-primary/20" : "border-white/10"
      }`}>
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
        />
        {suffix && <span className="shrink-0 text-xs text-muted-foreground">{suffix}</span>}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 text-xs text-destructive">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value, mono, highlight }: { label: string; value: React.ReactNode; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 p-3.5 sm:p-4">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={`text-right text-sm ${mono ? "font-mono" : ""} ${highlight ? "font-display text-lg font-bold" : "font-medium"}`}>{value}</span>
    </div>
  );
}
