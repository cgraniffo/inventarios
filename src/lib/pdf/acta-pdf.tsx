/**
 * PDF del Acta de Entrega de EPP, equipamiento y comunicaciones.
 *
 * Cabecera + datos del trabajador, tabla de ítems entregados (artículo/EPP y
 * activos serializados con N° de serie), declaración de responsabilidad y
 * bloque de firmas (trabajador + responsable de bodega). Paleta emerald.
 */

import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

const COLORS = {
  brand: "#065f46",
  brandLight: "#ecfdf5",
  brandDark: "#022c22",
  gray900: "#0f172a",
  gray700: "#334155",
  gray500: "#64748b",
  gray300: "#cbd5e1",
  gray200: "#e2e8f0",
  gray100: "#f1f5f9",
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9.5, fontFamily: "Helvetica", color: COLORS.gray900 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.brand,
    borderBottomStyle: "solid",
  },
  brand: { fontSize: 15, fontWeight: "bold", color: COLORS.brand, letterSpacing: 1 },
  brandSub: { fontSize: 8, color: COLORS.gray500, marginTop: 2 },
  docBlock: { flexDirection: "column", alignItems: "flex-end" },
  docTitle: { fontSize: 9, color: COLORS.gray500, letterSpacing: 2, textTransform: "uppercase" },
  docNumber: { fontSize: 18, fontWeight: "bold", color: COLORS.gray900, marginTop: 2 },
  docDate: { fontSize: 9, color: COLORS.gray500, marginTop: 2 },

  intro: { backgroundColor: COLORS.brandLight, borderRadius: 4, padding: 10, marginBottom: 12 },
  introTitle: { fontSize: 12, color: COLORS.brandDark, fontWeight: "bold" },
  introText: { fontSize: 9, color: COLORS.gray700, marginTop: 2, lineHeight: 1.4 },

  dataRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  dataItem: { minWidth: 120 },
  dataKey: { fontSize: 7.5, color: COLORS.gray500, textTransform: "uppercase", letterSpacing: 0.5 },
  dataValue: { fontSize: 9.5, color: COLORS.gray900, fontWeight: "bold", marginTop: 1 },

  table: { borderWidth: 1, borderColor: COLORS.gray200, borderStyle: "solid", borderRadius: 4 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.brand,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontSize: 7.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray100,
    borderBottomStyle: "solid",
  },
  cell: { textAlign: "left", fontSize: 8.5 },

  decl: {
    marginTop: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderStyle: "solid",
    borderRadius: 4,
  },
  declTitle: {
    fontSize: 8,
    color: COLORS.gray700,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  declText: { fontSize: 8.5, color: COLORS.gray700, lineHeight: 1.5 },

  firmas: { marginTop: 36, flexDirection: "row", justifyContent: "space-around", gap: 24 },
  firmaCol: { flex: 1, alignItems: "center" },
  firmaLinea: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray500,
    borderTopStyle: "solid",
    width: 180,
    marginBottom: 6,
  },
  firmaLabel: { fontSize: 8.5, color: COLORS.gray900, fontWeight: "bold" },
  firmaSub: { fontSize: 7.5, color: COLORS.gray500, marginTop: 1 },

  footer: {
    marginTop: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    borderTopStyle: "solid",
    fontSize: 7.5,
    color: COLORS.gray500,
    textAlign: "center",
  },
});

const ESTADO_LABEL: Record<string, string> = {
  entregado: "Entregado",
  devuelto: "Devuelto",
  perdido: "Perdido",
  dado_de_baja: "De baja",
};

export type ActaPDFItem = {
  tipo: string; // "EPP" | "Artículo" | "Activo serializado"
  descripcion: string;
  detalle: string;
  estado: string;
};

export type ActaPDFProps = {
  folio: number;
  fechaEntrega: string;
  estado: string;
  firmada: boolean;
  observacion: string | null;
  trabajador: string;
  rut: string | null;
  cargo: string | null;
  puesto: string | null;
  items: ActaPDFItem[];
  firmaData?: string | null;
  empresa?: string;
};

export function ActaPDF(props: ActaPDFProps) {
  const empresa = props.empresa ?? "Empresa Demo";
  return (
    <Document title={`Acta de entrega #${props.folio}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>{empresa.toUpperCase()}</Text>
            <Text style={styles.brandSub}>Control de EPP, equipamiento y comunicaciones</Text>
          </View>
          <View style={styles.docBlock}>
            <Text style={styles.docTitle}>Acta de entrega</Text>
            <Text style={styles.docNumber}>N° {String(props.folio).padStart(4, "0")}</Text>
            <Text style={styles.docDate}>{props.fechaEntrega}</Text>
          </View>
        </View>

        {/* Trabajador */}
        <View style={styles.intro}>
          <Text style={styles.introTitle}>{props.trabajador}</Text>
          <Text style={styles.introText}>
            {props.cargo ?? "—"}
            {props.rut ? ` · RUT ${props.rut}` : ""}
            {props.puesto ? ` · ${props.puesto}` : ""}
          </Text>
        </View>

        {/* Datos */}
        <View style={styles.dataRow}>
          <View style={styles.dataItem}>
            <Text style={styles.dataKey}>Fecha de entrega</Text>
            <Text style={styles.dataValue}>{props.fechaEntrega}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataKey}>Estado del acta</Text>
            <Text style={styles.dataValue}>{props.estado}</Text>
          </View>
          <View style={styles.dataItem}>
            <Text style={styles.dataKey}>Ítems</Text>
            <Text style={styles.dataValue}>{props.items.length}</Text>
          </View>
        </View>

        {/* Tabla de ítems */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 0.4 }]}>#</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.3 }]}>Tipo</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2.6 }]}>Descripción</Text>
            <Text style={[styles.tableHeaderCell, { flex: 2.2 }]}>Detalle</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.1 }]}>Estado</Text>
          </View>
          {props.items.map((it, i) => (
            <View
              key={i}
              style={[styles.tableRow, i === props.items.length - 1 ? { borderBottomWidth: 0 } : {}]}
            >
              <Text style={[styles.cell, { flex: 0.4 }]}>{i + 1}</Text>
              <Text style={[styles.cell, { flex: 1.3 }]}>{it.tipo}</Text>
              <Text style={[styles.cell, { flex: 2.6, fontWeight: "bold" }]}>{it.descripcion}</Text>
              <Text style={[styles.cell, { flex: 2.2 }]}>{it.detalle}</Text>
              <Text style={[styles.cell, { flex: 1.1 }]}>
                {ESTADO_LABEL[it.estado] ?? it.estado}
              </Text>
            </View>
          ))}
        </View>

        {props.observacion ? (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.dataKey}>Observación</Text>
            <Text style={[styles.declText, { marginTop: 2 }]}>{props.observacion}</Text>
          </View>
        ) : null}

        {/* Declaración */}
        <View style={styles.decl}>
          <Text style={styles.declTitle}>Declaración de recepción y responsabilidad</Text>
          <Text style={styles.declText}>
            El trabajador individualizado declara recibir conforme los elementos detallados en la
            presente acta, en buen estado y aptos para su uso. Se compromete a darles el uso
            adecuado, mantenerlos en buenas condiciones y restituirlos a la empresa al término de su
            contrato o cuando ésta lo requiera. La pérdida, extravío o daño por negligencia de los
            elementos marcados como restituibles podrá ser de cargo del trabajador conforme a la
            normativa vigente y al reglamento interno de la empresa.
          </Text>
        </View>

        {/* Firmas */}
        <View style={styles.firmas}>
          <View style={styles.firmaCol}>
            {props.firmaData ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf, no es <img> HTML
              <Image src={props.firmaData} style={{ width: 150, height: 50, objectFit: "contain" }} />
            ) : null}
            <View style={styles.firmaLinea} />
            <Text style={styles.firmaLabel}>{props.trabajador}</Text>
            <Text style={styles.firmaSub}>Trabajador (recibe conforme){props.rut ? ` · ${props.rut}` : ""}</Text>
          </View>
          <View style={styles.firmaCol}>
            <View style={styles.firmaLinea} />
            <Text style={styles.firmaLabel}>Responsable de bodega</Text>
            <Text style={styles.firmaSub}>Entrega / Pañol</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Acta de entrega N° {String(props.folio).padStart(4, "0")} · Generada el{" "}
          {new Date().toLocaleDateString("es-CL")} · Desarrollado por BData
        </Text>
      </Page>
    </Document>
  );
}
