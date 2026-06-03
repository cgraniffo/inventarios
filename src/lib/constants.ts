/** Catálogos y etiquetas del dominio (empresa de seguridad). */

export const CATEGORIAS_ARTICULO = [
  { value: "epp", label: "EPP" },
  { value: "uniforme", label: "Uniforme" },
  { value: "consumible", label: "Consumible" },
  { value: "equipamiento", label: "Equipamiento" },
  { value: "comunicaciones", label: "Comunicaciones" },
  { value: "accesorio", label: "Accesorio" },
  { value: "otro", label: "Otro" },
] as const;

export const CATEGORIAS_ACTIVO = [
  { value: "comunicaciones", label: "Comunicaciones (radios)" },
  { value: "equipamiento", label: "Equipamiento" },
  { value: "epp", label: "EPP serializado" },
  { value: "vehiculo", label: "Vehículo" },
  { value: "armamento", label: "Armamento" },
  { value: "otro", label: "Otro" },
] as const;

export const ESTADOS_ACTIVO = [
  { value: "operativo", label: "Operativo", color: "emerald" },
  { value: "asignado", label: "Asignado", color: "blue" },
  { value: "en_reparacion", label: "En reparación", color: "amber" },
  { value: "baja", label: "Dado de baja", color: "gray" },
  { value: "extraviado", label: "Extraviado", color: "rose" },
] as const;

export const TIPOS_UBICACION = [
  { value: "bodega_central", label: "Bodega central" },
  { value: "bodega", label: "Bodega" },
  { value: "puesto_servicio", label: "Puesto de servicio" },
  { value: "instalacion", label: "Instalación" },
] as const;

export const ESTADOS_ASIGNACION = [
  { value: "vigente", label: "Vigente", color: "emerald" },
  { value: "devuelto_parcial", label: "Devuelto parcial", color: "amber" },
  { value: "devuelto", label: "Devuelto", color: "gray" },
  { value: "anulada", label: "Anulada", color: "rose" },
] as const;

export const TIPOS_MANTENCION = [
  { value: "preventiva", label: "Preventiva" },
  { value: "correctiva", label: "Correctiva" },
  { value: "inspeccion", label: "Inspección" },
  { value: "calibracion", label: "Calibración" },
] as const;

export const UNIDADES = ["un", "par", "kg", "lt", "caja", "rollo", "m", "set"];

export const TALLAS = ["XS", "S", "M", "L", "XL", "XXL", "Única"];

export function labelDe<T extends { value: string; label: string }>(
  lista: readonly T[],
  value: string | null | undefined,
): string {
  return lista.find((x) => x.value === value)?.label ?? value ?? "—";
}
