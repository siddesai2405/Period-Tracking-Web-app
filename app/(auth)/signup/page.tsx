"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { signUp } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toaster";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] } }),
};

function passwordStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-amber-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-emerald-400" };
  return { score, label: "Strong", color: "bg-emerald-500" };
}

export default function SignupPage() {
  const router = useRouter();
  const push = useToast((s) => s.push);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; pwd?: string; agree?: string; general?: string }>({});

  const strength = passwordStrength(pwd);

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Your name is required";
    if (!email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!pwd) e.pwd = "Password is required";
    else if (pwd.length < 8) e.pwd = "Must be at least 8 characters";
    if (!agree) e.agree = "Please accept to continue";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate() || loading) return;
    setLoading(true);
    setErrors({});

    const { data, error } = await signUp(name.trim(), email, pwd);

    if (error || !data.user) {
      setErrors({ general: error?.message ?? "Could not create account. Please try again." });
      setLoading(false);
      return;
    }

    push({ title: `Welcome, ${name.trim()}!`, description: "Let's set up your cycle.", tone: "success" });
    router.push("/onboarding");
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <motion.div initial="hidden" animate="show">
      <motion.div custom={0} variants={fadeUp} className="mb-8">
        <h1 className="font-display text-3xl font-bold">Create your account</h1>
        <p className="mt-1.5 text-sm opacity-60">Free forever. Your data stays encrypted.</p>
      </motion.div>

      <form onSubmit={submit} noValidate className="space-y-4">
        {errors.general && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {errors.general}
          </motion.div>
        )}

        {/* Name */}
        <motion.div custom={1} variants={fadeUp}>
          <Label>Your name</Label>
          <div className="relative">
            <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
            <Input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); }}
              placeholder="What should Luna call you?"
              autoComplete="name"
              className={cn(
                "w-full h-12 rounded-2xl border bg-[rgb(var(--card)/0.78)] pl-11 pr-4 text-sm font-medium text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] placeholder:opacity-60 shadow-[0_10px_30px_-26px_rgba(93,56,86,0.40)] focus:outline-none transition-all",
                errors.name
                  ? "border-red-500/60 focus:border-red-500"
                  : "border-[rgb(var(--border)/0.82)] dark:border-white/[0.08] focus:border-[rgb(var(--acc-500)/0.6)] focus:bg-[rgb(var(--card)/0.94)] dark:focus:bg-white/[0.07]",
              )}
            />
          </div>
          {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>}
        </motion.div>

        {/* Email */}
        <motion.div custom={2} variants={fadeUp}>
          <Label>Email</Label>
          <div className="relative">
            <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
            <Input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
              placeholder="you@email.com"
              autoComplete="email"
              className={cn(
                "w-full h-12 rounded-2xl border bg-[rgb(var(--card)/0.78)] pl-11 pr-4 text-sm font-medium text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] placeholder:opacity-60 shadow-[0_10px_30px_-26px_rgba(93,56,86,0.40)] focus:outline-none transition-all",
                errors.email
                  ? "border-red-500/60 focus:border-red-500"
                  : "border-[rgb(var(--border)/0.82)] dark:border-white/[0.08] focus:border-[rgb(var(--acc-500)/0.6)] focus:bg-[rgb(var(--card)/0.94)] dark:focus:bg-white/[0.07]",
              )}
            />
          </div>
          {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
        </motion.div>

        {/* Password */}
        <motion.div custom={3} variants={fadeUp}>
          <Label>Password</Label>
          <div className="relative">
            <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
            <Input
              type={showPwd ? "text" : "password"}
              value={pwd}
              onChange={(e) => { setPwd(e.target.value); setErrors(prev => ({ ...prev, pwd: undefined })); }}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className={cn(
                "w-full h-12 rounded-2xl border bg-[rgb(var(--card)/0.78)] pl-11 pr-11 text-sm font-medium text-[rgb(var(--fg))] placeholder:text-[rgb(var(--muted))] placeholder:opacity-60 shadow-[0_10px_30px_-26px_rgba(93,56,86,0.40)] focus:outline-none transition-all",
                errors.pwd
                  ? "border-red-500/60 focus:border-red-500"
                  : "border-[rgb(var(--border)/0.82)] dark:border-white/[0.08] focus:border-[rgb(var(--acc-500)/0.6)] focus:bg-[rgb(var(--card)/0.94)] dark:focus:bg-white/[0.07]",
              )}
            />
            <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70 transition-opacity">
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {pwd && (
            <div className="mt-2 space-y-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-300", strength.score >= i ? strength.color : "bg-white/10")} />
                ))}
              </div>
              {strength.label && (
                <p className={cn("text-xs", strength.score <= 1 ? "text-red-400" : strength.score <= 2 ? "text-amber-400" : "text-emerald-400")}>
                  {strength.label} password
                </p>
              )}
            </div>
          )}
          {errors.pwd && <p className="mt-1.5 text-xs text-red-400">{errors.pwd}</p>}
        </motion.div>

        {/* Agreement */}
        <motion.div custom={4} variants={fadeUp}>
          <label className={cn("flex items-start gap-3 cursor-pointer select-none", errors.agree && "animate-pulse")}>
            <div
              onClick={() => { setAgree(v => !v); setErrors(prev => ({ ...prev, agree: undefined })); }}
              className={cn(
                "mt-0.5 shrink-0 h-5 w-5 rounded-md border transition-all flex items-center justify-center",
                agree ? "border-transparent" : errors.agree ? "border-red-500/60 bg-white/[0.04]" : "border-[rgb(var(--border))] bg-white/[0.04]",
              )}
              style={agree ? { background: "linear-gradient(135deg, rgb(var(--gstart)), rgb(var(--gend)))" } : {}}
            >
              {agree && <Check size={11} className="text-white" strokeWidth={3} />}
            </div>
            <span className="text-sm opacity-70 leading-snug">
              I agree to Lotus Phase&apos;s{" "}
              <a href="#" className="text-[rgb(var(--acc-400))] hover:opacity-70 transition-opacity">Terms</a>
              {" "}and{" "}
              <a href="#" className="text-[rgb(var(--acc-400))] hover:opacity-70 transition-opacity">Privacy Policy</a>
            </span>
          </label>
          {errors.agree && <p className="mt-1.5 text-xs text-red-400">{errors.agree}</p>}
        </motion.div>

        {/* Submit */}
        <motion.div custom={5} variants={fadeUp}>
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Creating account...
              </span>
            ) : (
              <>Create free account <ArrowRight size={15} /></>
            )}
          </Button>
        </motion.div>
      </form>

      <motion.div custom={6} variants={fadeUp} className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-[rgb(var(--border))]" />
        <span className="text-xs opacity-40 font-medium">or sign up with</span>
        <div className="h-px flex-1 bg-[rgb(var(--border))]" />
      </motion.div>

      <motion.div custom={7} variants={fadeUp}>
        <button
          type="button"
          onClick={handleGoogle}
          className="w-full h-12 rounded-2xl border border-[rgb(var(--border)/0.86)] bg-[rgb(var(--card)/0.72)] text-[rgb(var(--fg))] shadow-[0_12px_30px_-26px_rgba(93,56,86,0.42)] transition-all flex items-center justify-center gap-3 text-sm font-semibold hover:-translate-y-0.5 hover:bg-[rgb(var(--card)/0.94)] dark:bg-white/[0.055] dark:hover:bg-white/[0.10]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
      </motion.div>

      <motion.p custom={8} variants={fadeUp} className="mt-7 text-center text-sm opacity-60">
        Already have an account?{" "}
        <Link href="/login" className="text-[rgb(var(--acc-400))] hover:opacity-70 font-semibold transition-opacity">
          Log in
        </Link>
      </motion.p>

      <motion.p custom={9} variants={fadeUp} className="mt-4 text-center text-[11px] opacity-40 flex items-center justify-center gap-1.5">
        <Sparkles size={10} />
        No credit card needed - 100% private - End-to-end encrypted
      </motion.p>
    </motion.div>
  );
}
