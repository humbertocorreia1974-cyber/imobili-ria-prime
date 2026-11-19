# Sistema de design — Imobiliária Prime
Gerado com **UI/UX Pro Max** (curadoria de estilo + paleta + tipografia).
- **Estilo:** Liquid Glass
- **Palavras-chave:** dynamic material, optical glass, translucency, lensing, refraction, fluid morphing, system navigation
- **Modo:** light
- **Fontes:** Cormorant (títulos) / Montserrat (corpo)
- **Efeitos:** Lensing and refraction, adaptive translucency, and fluid morph transitions aligned to Apple platform behavior
- **Padrão de landing:** Scroll-Triggered Storytelling — Intro hook > Chapter 1 (problem) > Chapter 2 (journey) > Chapter 3 (solution) > Climax CTA
- **Evitar:** Cheap visuals + Fast animations
## Tokens (CSS vars em `app/globals.css`)
```css
--bg: 60 9% 98%;
--surface: 0 0% 100%;
--surface-2: 210 21% 93%;
--border: 24 6% 83%;
--fg: 20 14% 4%;
--fg-muted: 215 19% 35%;
--brand: 24 10% 10%;
--brand-fg: 0 0% 100%;
--accent: 35 92% 33%;
--accent-fg: 0 0% 100%;
```
_Use SEMPRE os tokens (`bg-brand`, `text-fg`, `border-border`…), nunca hex cru._