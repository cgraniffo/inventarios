/**
 * Cálculo de stock de artículos. Stock actual = stock_inicial + Σ movimientos
 * (cantidad con signo: entrada +, salida −, ajuste = delta). Mismo patrón que
 * el saldo de una cuenta corriente.
 */
import type { Articulo } from "@/lib/types";

export type Semaforo = "rojo" | "amarillo" | "verde";

export type StockCalc = Articulo & {
  stockActual: number;
  valorizacion: number;
  semaforo: Semaforo;
};

/**
 * Semáforo de stock. Si el artículo define umbrales propios, mandan esos; si no,
 * regla global: 🔴 ≤ 50% del mínimo · 🟡 ≤ mínimo · 🟢 sobre el mínimo.
 * Sin stock (≤ 0) siempre es rojo.
 */
export function calcularSemaforo(
  stock: number,
  minimo: number,
  umbralRojo: number | null,
  umbralAmarillo: number | null,
): Semaforo {
  if (stock <= 0) return "rojo";
  if (umbralRojo != null && stock <= umbralRojo) return "rojo";
  if (umbralAmarillo != null && stock <= umbralAmarillo) return "amarillo";
  if (umbralRojo != null || umbralAmarillo != null) return "verde";
  if (minimo > 0) {
    if (stock <= minimo * 0.5) return "rojo";
    if (stock <= minimo) return "amarillo";
  }
  return "verde";
}

/** Devuelve cada artículo con su stock actual, valorización y semáforo. */
export function calcularStock(
  articulos: Articulo[],
  movimientos: { articulo_id: string; cantidad: number | string }[],
): StockCalc[] {
  const sumas = new Map<string, number>();
  for (const m of movimientos) {
    sumas.set(m.articulo_id, (sumas.get(m.articulo_id) ?? 0) + Number(m.cantidad ?? 0));
  }
  return articulos.map((p) => {
    const stockActual = Number(p.stock_inicial ?? 0) + (sumas.get(p.id) ?? 0);
    const precio = Number(p.precio_referencia ?? 0);
    return {
      ...p,
      stockActual,
      valorizacion: stockActual * precio,
      semaforo: calcularSemaforo(
        stockActual,
        Number(p.stock_minimo ?? 0),
        p.umbral_rojo,
        p.umbral_amarillo,
      ),
    };
  });
}

export const ICONO_SEMAFORO: Record<Semaforo, string> = {
  rojo: "🔴",
  amarillo: "🟡",
  verde: "🟢",
};
