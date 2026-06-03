import Link from "next/link";

type SearchParams = Promise<{ email?: string }>;

export default async function CheckEmailPage({ searchParams }: { searchParams: SearchParams }) {
  const { email } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-white p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">📧</div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Revisa tu correo</h1>
        {email ? (
          <p className="mt-2 text-sm text-slate-600">
            Te enviamos un enlace de acceso a <strong className="text-slate-900">{email}</strong>.
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">Te enviamos un enlace de acceso a tu correo.</p>
        )}
        <p className="mt-4 text-xs text-slate-500">
          Haz clic en el enlace para entrar. Si no lo ves, revisa tu carpeta de spam.
        </p>
        <Link href="/auth/login" className="mt-6 inline-block text-sm font-medium text-emerald-700 hover:underline">
          ← Usar otro correo
        </Link>
      </div>
    </main>
  );
}
