# pedropompeu.github.io — Pompeu Web (provisório)

Site da Pompeu Web publicado aqui até o primeiro cliente. Depois ele vai para a Hostinger em `pompeuweb.com.br`.

**Não edite os arquivos deste repositório à mão.** A fonte fica em `Projetos_holding/Projeto-PompeuWeb-02-11-2026/site/`. Para atualizar:

```bash
cd ~/Dev/Projetos_holding/Projeto-PompeuWeb-02-11-2026
python3 tools/pacote.py --github      # roda os testes e gera dist/github/
cd ~/Dev/pedropompeu.github.io
git rm -rq --ignore-unmatch -- . ':!README.md' ':!.superpowers'
cp -a ~/Dev/Projetos_holding/Projeto-PompeuWeb-02-11-2026/dist/github/. .
git add -A && git commit -m "chore: update pompeu web site" && git push
```

O portfólio antigo de AI Product Engineer continua no histórico do git (commit `a9ca07f`).
