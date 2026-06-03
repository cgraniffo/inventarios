/** Tipos del dominio (reflejan las columnas de la BD; snake_case). */

export type Ubicacion = {
  id: string;
  nombre: string;
  tipo: string;
  direccion: string | null;
  responsable: string | null;
  telefono: string | null;
  activo: boolean;
  observacion: string | null;
};

export type Personal = {
  id: string;
  nombre: string;
  rut: string | null;
  cargo: string | null;
  ubicacion_id: string | null;
  telefono: string | null;
  email: string | null;
  fecha_ingreso: string | null;
  activo: boolean;
  observacion: string | null;
};

export type Articulo = {
  id: string;
  nombre: string;
  codigo: string | null;
  categoria: string;
  unidad: string;
  es_epp: boolean;
  talla: string | null;
  norma_certificacion: string | null;
  vida_util_meses: number | null;
  requiere_devolucion: boolean;
  stock_inicial: number;
  fecha_stock_inicial: string | null;
  stock_minimo: number;
  umbral_rojo: number | null;
  umbral_amarillo: number | null;
  precio_referencia: number;
  ubicacion_id: string | null;
  activo: boolean;
  observacion: string | null;
};

export type Activo = {
  id: string;
  nombre: string;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  categoria: string;
  estado: string;
  ubicacion_id: string | null;
  asignado_a: string | null;
  fecha_adquisicion: string | null;
  valor: number | null;
  vida_util_meses: number | null;
  fecha_vencimiento: string | null;
  observacion: string | null;
  activo: boolean;
};

export type Movimiento = {
  id: string;
  articulo_id: string;
  tipo: "entrada" | "salida" | "ajuste";
  cantidad: number;
  origen: string;
  ubicacion_id: string | null;
  asignacion_id: string | null;
  fecha: string;
  valor_unitario: number | null;
  valor_total: number | null;
  observacion: string | null;
};

export type Asignacion = {
  id: string;
  folio: number;
  personal_id: string;
  ubicacion_id: string | null;
  fecha_entrega: string;
  estado: string;
  firmada: boolean;
  observacion: string | null;
};

export type AsignacionItem = {
  id: string;
  asignacion_id: string;
  articulo_id: string | null;
  activo_id: string | null;
  cantidad: number;
  talla: string | null;
  fecha_devolucion: string | null;
  estado: string;
  observacion: string | null;
};

export type Mantencion = {
  id: string;
  activo_id: string;
  fecha: string;
  tipo: string;
  descripcion: string | null;
  costo: number | null;
  proveedor: string | null;
  proximo_vencimiento: string | null;
  estado: string;
};
