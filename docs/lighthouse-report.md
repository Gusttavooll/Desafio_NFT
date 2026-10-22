# Lighthouse: resultado final da demonstração

Medição concluída em 21/10/2026, no preview do build de produção com mocks em `http://127.0.0.1:5241`. Foram realizadas **12 execuções sequenciais**, três para cada combinação de início/detalhe e mobile/desktop, sem testes de navegador ou builds concorrentes.

| Página | Perfil | Performance (meta 90) | Acessibilidade (meta 95) | Boas práticas (meta 95) | SEO (meta 90) |
|---|---|---:|---:|---:|---:|
| Início | Mobile | **87 — abaixo da meta** | 100 | 100 | 100 |
| Início | Desktop | 99 | 100 | 100 | 100 |
| Detalhe Emerald Ape | Mobile | **84 — abaixo da meta** | 100 | 100 | 100 |
| Detalhe Emerald Ape | Desktop | 99 | 100 | 100 | 100 |

As células são medianas. **A meta de performance mobile do PRD não foi atingida; a auditoria global não está aprovada.** As demais metas medidas foram atingidas. O script concluiu a coleta e sinalizou falha de threshold, sem erro de execução do Lighthouse.

## Evidência e ambiente

Relatórios completos: `lighthouse-reports/final-20261022/` (diretório local ignorado pelo Git; o nome da pasta não define a data da medição). Contém 12 HTML, 12 JSON, `environment.json`, `summary.json` e `summary.md`. As capturas finais representativas de cada página/perfil foram extraídas dos JSON e inspecionadas: header, título, imagem da obra e controles estavam renderizados, sem fallback vazio ou skeleton. Nenhum dos 12 relatórios contém `runtimeError`.

- Lighthouse 13.5.0; Node v24.14.1; Windows NT 10.0.26300.0; HeadlessChrome 156.0.0.0.
- Mobile usa emulação padrão do Lighthouse (Moto G Power/Android), desktop usa `--preset=desktop`. Não houve alteração dos critérios de pontuação.
- Performance por execução: início/mobile 86, 88, 87; início/desktop 100, 99, 99; detalhe/mobile 84, 84, 84; detalhe/desktop 99, 99, 99.
- Acessibilidade, boas práticas e SEO: 100 em todas as 12 execuções.

## Pendência de performance

No mobile final, o início apresentou FCP entre 2,2 e 2,5 s, LCP entre 3,6 e 3,7 s e TBT entre 40 e 90 ms. O detalhe apresentou FCP entre 2,4 e 2,5 s, LCP de 4,0 s e TBT entre 40 e 50 ms. Desktop ficou entre 0,8 e 0,9 s de LCP.

A análise preliminar identificou custo relevante no bootstrap de MSW e suas dependências de cookies/sufixos de domínio, além da descoberta de recursos após iniciar a aplicação. Foram aplicados bootstrap paralelo da aplicação e MSW, importação tardia de Socket.IO, carregamento antecipado das duas rotas públicas, fontes WOFF2 com preload do título, prioridade da imagem principal, ausência de logs detalhados em produção e correção de favicon/robots. Os mocks, cookies, eventos e critérios de auditoria foram preservados. As melhorias não bastaram para atingir 90 no mobile; resolver esse ponto exige trabalho adicional e nova medição.

## Reproduzir

Após as 12 medições, foi ensaiado um plugin que antecipava, via `modulepreload`, os chunks obrigatórios de aplicação/MSW e seus imports estáticos. Lint e build passaram, mas os dois preflights mobile não mostraram melhora: início 82 (FCP 3,5 s, LCP 3,7 s) e detalhe 80 (FCP 3,4 s, LCP 4,0 s); as outras categorias ficaram em 100. O plugin experimental foi retirado, sem alteração da semântica de mocks/cookies. Relatórios desse ensaio: `lighthouse-reports/preflight-modulepreload/`. As medianas de 12 execuções acima continuam sendo a referência do código mantido.

Após gerar o build com `VITE_ENABLE_MOCKS=true` e iniciar seu preview na porta 5241, sem E2E ou outros benchmarks concorrentes:

```powershell
pwsh -File scripts/lighthouse.ps1 -BaseUrl http://127.0.0.1:5241
```

A configuração em `scripts/lighthouse.config.json` fixa a CLI `lighthouse@13.5.0`, as páginas e thresholds. `-ChromePath` permite apontar um Chrome instalado; `-DetailPath` troca a obra; `-OutputDirectory` seleciona uma pasta externa ou ignorada. `-SummarizeOnly -OutputDirectory <pasta>` recalcula os resultados existentes sem abrir navegador. Não há dependência Lighthouse adicionada ao pacote do aplicativo.

O preview local não comprova a latência da URL publicada. Testes funcionais, build e estas notas de acessibilidade automatizadas não substituem avaliação manual de acessibilidade nem comprovam desempenho de produção.
