-- Firma digital del acta de entrega: guarda la imagen de la firma (PNG en
-- base64 data URL) y la marca de tiempo en que se firmó.
alter table asignaciones
  add column if not exists firma_data text,
  add column if not exists firmada_at timestamptz;
