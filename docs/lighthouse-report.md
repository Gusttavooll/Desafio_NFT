# Lighthouse: configuração e estado da medição

Em 21/10/2026, o roteiro reutilizável foi preparado em `scripts/lighthouse.ps1`, com metas em `scripts/lighthouse.config.json`. Mede três execuções sequenciais por combinação: início e detalhe, mobile e desktop (12 execuções). Calcula a mediana por categoria e retorna código 2 quando alguma meta falha: Performance 90, Acessibilidade 95, Boas práticas 95, SEO 90.

## Execução

Após gerar o build com `VITE_ENABLE_MOCKS=true` e iniciar seu preview na porta 5241, encerre testes E2E e outros benchmarks antes de executar:

```powershell
pwsh -File scripts/lighthouse.ps1 -BaseUrl http://127.0.0.1:5241
```

Se o Chrome não for descoberto automaticamente, informe `-ChromePath` com o executável instalado. `-DetailPath` permite escolher outra obra existente. `-OutputDirectory` aceita uma pasta externa; por padrão os relatórios ficam em `lighthouse-reports/<data-hora>`, ignorada pelo Git. Para recalcular medianas de relatórios existentes sem abrir navegador, use `-SummarizeOnly -OutputDirectory <pasta>`.

O script usa a CLI oficial por `npx --yes lighthouse@13.5.0`, versão fixada na configuração, sem adicionar dependências ao projeto. Registra versão da CLI, Node, sistema e configuração em `environment.json`; cada relatório inclui versão do Chrome, user agent, configuração e auditorias. Gera HTML/JSON por execução e `summary.md`/`summary.json` com medianas. Arquive os relatórios e atualize este documento com o resumo da execução concluída.

## Resultado disponível

O bloqueio inicial de espaço (`ENOSPC`) foi resolvido; a CLI 13.5.0 teve `--version` e `--help` validados. Foi concluída **uma execução preliminar do início em mobile**, no preview do build com mocks em `http://127.0.0.1:5241/`, antes das 12 medições. Os arquivos estão em `lighthouse-reports/preflight/home-mobile-1.report.{html,json}`.

| Execução preliminar | Performance | Acessibilidade | Boas práticas | SEO |
|---|---:|---:|---:|---:|
| Início / mobile / 1 | 78 | 100 | 96 | 92 |
| Início / mobile / após correções de bootstrap e arquivos públicos | 85 | 100 | 100 | 100 |
| Início / mobile / bootstrap paralelo e WOFF2 | 86 | 100 | 100 | 100 |
| Detalhe / mobile / bootstrap paralelo e WOFF2 | 81 | 100 | 100 | 100 |

**Ainda não são medianas e a meta de performance não foi atingida.** As 12 execuções foram adiadas para corrigir os achados concretos antes da medição final. Na primeira rodada: FCP 2,9 s, LCP 3,9 s, TBT 240 ms; aproximadamente 95 KiB de JavaScript não utilizado, CSS bloqueante estimado em 300 ms. `favicon.ico` retornava 404 e `robots.txt` retornava o fallback HTML; ambos foram corrigidos antes da segunda rodada.

Na segunda rodada (`lighthouse-reports/preflight-final/home-mobile-1.report.{html,json}`), FCP 2,8 s, LCP 3,5 s e TBT 80 ms. A captura final foi inspecionada: header, texto principal, botões, arte em destaque e navegação estavam renderizados. O LCP é o título `h1#archive-title`, não um skeleton. As seis fontes e três artes SVG constam como respostas 200; tamanho transferido zero nos recursos intermediados por MSW não significa ausência do conteúdo. Permanecem o custo do bootstrap e o carregamento das fontes. O primeiro relatório também registrou pressão crítica de memória na avaliação de back/forward cache (`CacheLimitPrunedOnCriticalMemoryPressure`), sem atribuir essa condição ao aplicativo.

Preview local não comprova latência da URL pública. Não substituir medições ausentes por resultados de build, testes funcionais ou estimativas.

A rodada `preflight-woff2` mediu o bootstrap paralelo e as fontes locais comprimidas: início FCP 2,4 s, LCP 3,7 s, TBT 80 ms; detalhe FCP 2,4 s, LCP 4,0 s, TBT 220 ms. No detalhe o LCP é a imagem real da obra, com atraso de descoberta de aproximadamente 627 ms e recomendação de prioridade alta. O bootstrap MSW ainda concentra parte relevante do custo de execução. As medições finais seguem pendentes após ajustes finais de interface e desempenho.
