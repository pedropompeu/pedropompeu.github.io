# pedropompeu.github.io — AI Product Engineer

Página estática (HTML puro, sem build) para GitHub Pages.
Posicionamento: **AI Product Engineer | Python, LLM Agents & APIs de alta performance | Django + React**

## Rodar local
```bash
python3 -m http.server 8000 --directory /home/usuario/Dev/pedropompeu.github.io
# abrir http://localhost:8000
```

## Deploy (2 opções)

**A — User site (recomendado): `https://pedropompeu.github.io`**
1. No GitHub, crie o repo `pedropompeu.github.io` (público)
2. Neste pasta:
```bash
git init -b main
git add index.html .nojekyll README.md
git commit -m "feat: add AI Product Engineer page"
git remote add origin https://github.com/pedropompeu/pedropompeu.github.io.git
git push -u origin main
```
3. Settings > Pages > Deploy from branch > main / root. Propaga em ~1 min.

**B — Project site:** crie repo `ai-profile`, push igual, ativa Pages. URL será `pedropompeu.github.io/ai-profile`.

## Estado atual
- [x] Email oficial: pedrolpompeu@gmail.com · tel (53) 98109-7510
- [x] Canônicos: LinkedIn `/in/pedro-pompeu` + GitHub `@pedropompeu`
- [x] Cases com prints reais em `assets/`: Trello IA, app Floripa, dados Postgres
- [x] Hero interativo estilo KreaKodo (código RAG se digitando + parallax + glow no mouse)
- [ ] Unificar empresa atual: currículo diz `Nexxera`, LinkedIn diz `Grupo Nexxees`
- [ ] Métricas da Nexxera (p95 / coverage) quando tiver
- [ ] Foto profissional + favicon (opcional)
- [ ] Custom domain (opcional): adicionar `CNAME`
