/**
 * Devuelve el origen canónico para redirecciones de auth.
 *
 * En Netlify, el servidor recibe el host del deploy específico
 * (`https://<deployid>--<sitio>.netlify.app`), no el canónico
 * (`https://<sitio>.netlify.app`). Si redirigimos a ese host, la cookie de
 * sesión (puesta en el host canónico que abre el magic link) no viaja y el
 * login entra en loop. Acá normalizamos al host canónico.
 *
 * Prioridad: NEXT_PUBLIC_SITE_URL (para dominio propio) → quitar prefijo de
 * deploy de Netlify → el origin tal cual (ej. localhost en desarrollo).
 */
export function canonicalBase(origin: string): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  // https://6a204bfca5a1ee--sitio.netlify.app → https://sitio.netlify.app
  return origin.replace(/\/\/[a-z0-9]+--/i, "//");
}
