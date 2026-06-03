/** Helpers de formato (CLP, números, fechas) — español de Chile. */

const CLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export const fCLP = (n: number | null | undefined) =>
  CLP.format(Math.round(Number(n ?? 0)));

export const fNum = (n: number | null | undefined) =>
  new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(Number(n ?? 0));

export const fDate = (s: string | null | undefined) => {
  if (!s) return "—";
  const [y, m, d] = s.slice(0, 10).split("-");
  return y ? `${d}/${m}/${y}` : s;
};

/** Hoy en formato YYYY-MM-DD (zona local). */
export const hoyISO = () => new Date().toISOString().slice(0, 10);

/** Días entre hoy y una fecha (negativo = ya pasó). */
export function diasHasta(fecha: string | null | undefined): number | null {
  if (!fecha) return null;
  const hoy = new Date(hoyISO());
  const f = new Date(fecha.slice(0, 10));
  return Math.round((f.getTime() - hoy.getTime()) / 86400000);
}
