"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Error proveniente del callback (derivado del query string, sin efecto).
  const errorParam =
    searchParams.get("error") === "auth_failed"
      ? searchParams.get("reason")
        ? `No se pudo iniciar sesión: ${decodeURIComponent(searchParams.get("reason") as string)}`
        : "No se pudo iniciar sesión."
      : null;
  const mensajeError = errorMsg ?? errorParam;

  async function enviarEnlace(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Escribe tu correo primero.");
      return;
    }
    setEnviando(true);
    setErrorMsg(null);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      // Flujo token_hash (ver src/app/auth/confirm/route.ts): robusto en celular.
      options: { emailRedirectTo: `${origin}/auth/confirm` },
    });

    setEnviando(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    router.push(`/auth/check-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-white p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-md">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div className="leading-tight">
            <h1 className="text-lg font-bold text-slate-900">Empresa Demo</h1>
            <p className="text-[11px] text-slate-500">Inventario de Seguridad</p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-bold text-slate-900">Iniciar sesión</h2>
          <p className="mt-1 text-sm text-slate-600">
            Te enviamos un enlace de acceso de un solo uso a tu correo. Sin contraseñas.
          </p>
        </div>

        <form onSubmit={enviarEnlace} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.cl"
              disabled={enviando}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {mensajeError && (
            <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{mensajeError}</div>
          )}

          <button
            type="submit"
            disabled={enviando || !email}
            className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:bg-slate-300"
          >
            {enviando ? "Enviando enlace…" : "Enviarme el enlace de acceso"}
          </button>
        </form>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          Desarrollado por
          <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-emerald-600 text-[10px] font-bold leading-none text-white">b</span>
          <span className="font-semibold text-slate-500">BData</span>
        </p>
      </div>
    </main>
  );
}
