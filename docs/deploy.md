# Despliegue (Git + Netlify)

## 1. Repositorio en GitHub
El código se versiona en GitHub (repo privado). El primer commit ya está hecho en la rama `main`.

## 2. Conectar Netlify al repo
1. En [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project → GitHub**.
2. Elige el repo `inventario-seguridad`.
3. Netlify detecta Next.js solo. Build command y publish ya vienen en `netlify.toml`.
4. Antes de desplegar, agrega las **variables de entorno** (paso 3).

## 3. Variables de entorno en Netlify
**Site configuration → Environment variables** (las mismas de `.env.local`, NO se commitean):

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://jcbnrtuicqlbwxvambch.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la publishable key del proyecto |
| `ANTHROPIC_API_KEY` | tu clave de Anthropic (para el asistente IA) |

## 4. Configurar Supabase Auth para el dominio de producción
Para que el magic link funcione en el dominio de Netlify:
**Supabase → Authentication → URL Configuration**:
- **Site URL**: la URL de Netlify (ej. `https://inventario-seguridad.netlify.app` o tu dominio).
- **Redirect URLs**: agregar `https://TU-DOMINIO/**` (además de `http://localhost:3000/**`).

## 5. Deploy automático
Con el repo conectado, cada push a `main` dispara un build y deploy automático.

## Notas
- `.env.local` está en `.gitignore`: las claves nunca se suben al repo, solo a las env vars de Netlify.
- Next.js 16 es muy nuevo; si el runtime de Netlify da problemas, revisar la versión de
  `@netlify/plugin-nextjs` o desplegar en Vercel como alternativa.
