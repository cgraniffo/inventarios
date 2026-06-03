# Plantillas de correo (Supabase Auth)

Plantillas HTML con identidad BData para los correos de autenticación, listas para
pegar en **Supabase → Authentication → Email Templates**. Todas son email-safe
(tablas + estilos inline, botón a prueba de Outlook, sin imágenes externas).

| Archivo | Slot en Supabase | Variable que usa | Asunto sugerido |
|---|---|---|---|
| `magic-link.html` | Magic Link | `{{ .RedirectTo }}` + `{{ .TokenHash }}` (flujo token-hash → ruta `/auth/confirm`; robusto en celular) | Tu enlace de acceso a Empresa Demo |
| `confirm-signup.html` | Confirm signup | `{{ .ConfirmationURL }}` | Confirma tu cuenta en Empresa Demo |
| `invite.html` | Invite user | `{{ .ConfirmationURL }}` | Te invitaron a Empresa Demo |
| `change-email.html` | Change Email Address | `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}` | Confirma tu nuevo correo |
| `reset-password.html` | Reset Password | `{{ .ConfirmationURL }}` | Restablecer tu contraseña |
| `reauthentication.html` | Reauthentication | `{{ .Token }}` (código de 6 dígitos) | Tu código de verificación |

## Cómo aplicarlas

1. Supabase Dashboard → proyecto `inventario-seguridad` → **Authentication → Email Templates**.
2. Elige la pestaña del template, pega el HTML del archivo correspondiente en **Message body**.
3. Ajusta el **Subject** (columna de arriba).
4. Guarda. Repite por cada template.

> Como hoy el login es **solo magic link**, el imprescindible es `magic-link.html`.
> Los demás aplican si activas signup con confirmación, invitaciones desde el panel,
> cambio de correo o reautenticación. `reset-password.html` solo aplica si algún día
> agregas login con contraseña.

## Para que salgan por Resend (no el SMTP gratis de Supabase)

Supabase → **Project Settings → Authentication → SMTP Settings**:

- Host `smtp.resend.com` · Port `465` · User `resend` · Password = tu `RESEND_API_KEY`
- **Sender email**: dirección de un dominio verificado en Resend (ej. `no-reply@bdata.cl`)

El HTML lo controla siempre Supabase; Resend es solo el transporte.

## Rebranding

Para cambiar "Empresa Demo" por la razón social real: buscar/reemplazar el texto
`Empresa Demo` en cada `.html` (aparece en el preheader y en el header).
