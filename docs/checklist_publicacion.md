# Checklist de publicación: disrupthings-web v1

Revisado el 13 de octubre de 2026, 21:30 CDMX, con Chromium (Playwright) a 390 px y 1280 px, modo claro y oscuro, en servidor local. No probado aún en el dominio real ni en un teléfono físico.

| # | Punto | Estado | Qué se hizo o por qué |
| --- | --- | --- | --- |
| 1 | Política de privacidad | Cumple con límite | `privacidad.html` según la LFPDPPP 2025. Falta el domicilio legal completo de DS y revisión de un abogado |
| 2 | Términos y condiciones | Cumple | `terminos.html` |
| 3 | API y secretos | Cumple | Sitio estático, sin llaves ni tokens |
| 4 | Forzar HTTPS | Pendiente del hosting | Activar "Enforce HTTPS" en GitHub Pages o "Always Use HTTPS" en Cloudflare |
| 5 | Banner de cookies | No aplica | Sin cookies ni analítica de terceros |
| 6 | Título y metadescripción | Cumple | En todas las páginas, ES y EN |
| 7 | Vista previa del enlace | Cumple | Open Graph y Twitter con `og.png` y `og-en.png` de 1200×630 |
| 8 | Favicon | Cumple | `favicon.svg` y `apple-touch-icon.png` |
| 9 | Sitemap y robots.txt | Cumple | Con hreflang ES/EN; `/docs/` fuera del índice |
| 10 | Texto ALT | Cumple | Sin imágenes de contenido; íconos con `aria-hidden`, conversación con `aria-label` |
| 11 | Comprimir imágenes | Cumple | PNG optimizados, 44 KB cada imagen social |
| 12 | Velocidad de carga | Cumple con límite | Página estática de ~30 KB más Google Fonts. Medir con PageSpeed ya publicada |
| 13 | Contraste | Cumple | Texto secundario 7.0:1 (claro) y 8.2:1 (oscuro); etiqueta rosa 4.8:1 y 5.4:1; mínimo medido 4.65:1 |
| 14 | Móvil | Cumple | Sin scroll horizontal a 390 px en las 5 páginas; tabla de precios se apila en teléfono |
| 15 | Página 404 | Cumple | `404.html` con `noindex` |
| 16 | Enlaces rotos | Cumple con límite | Anclas internas y páginas OK. Externos: pilotolegal.disrupthings.com responde; Calendly responde, pero el evento se llama "Piloto Legal" |
| 17 | Validar formularios | No aplica | Sin formularios; contacto por correo y Calendly |
| 18 | Spam / fuerza bruta | No aplica | Sin formularios ni login |
| 19 | Analítica | Decisión: sin analítica por ahora | Propuesta: Cloudflare Web Analytics, que no usa cookies |
| 20 | CTA claro | Cumple | Un botón principal por pantalla: Ver productos, Agendar una llamada |

## Mejoras propuestas

| Mejora | Calificación | Estado |
| --- | --- | --- |
| Versión en inglés con hreflang, porque los programas de créditos revisan en inglés | 9 | Implementada (`/en/`) |
| Tabla de precios apilada en teléfono | 8 | Implementada |
| Analítica sin cookies (Cloudflare Web Analytics) | 7 | Propuesta; requiere la cuenta de Cloudflare |
| Evento de Calendly general de DS en lugar de "Piloto Legal" | 7 | Propuesta; requiere tu cuenta de Calendly |
| Fuentes alojadas en el propio sitio, sin Google Fonts | 6 | Propuesta |
| Versión en ruso, como el sitio anterior | 5 | Propuesta |
