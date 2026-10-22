# Revisão dos quatro alertas GitGuardian de 21/10/2026

Os quatro incidentes associados ao commit `708a14847a05b1959d3bde4133bb3e4bd75a0b64` foram conferidos individualmente no painel GitGuardian e comparados com as ocorrências e as asserções dos testes. Nenhum dos quatro valores é uma credencial operacional de serviço. Os valores não são reproduzidos neste relatório.

| Incidente | Ocorrência no commit | Evidência | Classificação no painel |
|---|---|---|---|
| [38833339](https://dashboard.gitguardian.com/workspace/723042/incidents/38833339) | `src/mocks/account/account-response.test.ts`, linhas 6 e 49 | Senha da conta fictícia da demonstração, usada para login e troca de senha dentro de `Simulation`. A troca espera status 204. A credencial demonstrativa já existia na fundação `c9db685`. | Ignored — Test credential |
| [38833340](https://dashboard.gitguardian.com/workspace/723042/incidents/38833340) | Mesmo arquivo, linha 47 | Senha atual propositalmente errada; a asserção seguinte exige erro em `details.currentPassword`. | Ignored — Test credential |
| [38833342](https://dashboard.gitguardian.com/workspace/723042/incidents/38833342) | Mesmo arquivo, linhas 31 e 32 | Senha incorreta enviada para emails fictícios existente e ausente. O teste exige respostas iguais para evitar enumeração de contas. | Ignored — Test credential |
| [38833341](https://dashboard.gitguardian.com/workspace/723042/incidents/38833341) | `src/domain/account/validation.test.ts`, linha 25 | Rota relativa de NFT passada a `safeAuthCancelPath`; o teste verifica que essa rota é preservada. O detector interpretou o argumento da função como segredo. | Ignored — Not a secret (false positive) |

Os testes de Conta chamam `accountResponse` diretamente na simulação local, sem autenticar em um serviço externo. A decisão sobre os quatro incidentes foi individual; não foram criadas exclusões de arquivos ou regras amplas de supressão.

## Verificação complementar e limites

Uma varredura local do snapshot encontrou 783 arquivos rastreados: 750 textuais analisados e 33 binários excluídos. Não houve correspondência para os formatos pesquisados de chaves Google/Gemini, Stripe secret/webhook, GitHub, AWS, JWT ou PEM. Candidatos genéricos em documentação vendorizada foram conferidos como exemplos de mock e PostgreSQL local de testes, anteriores a este commit. Também foram examinadas as linhas adicionadas nos commits `1a3d165`, `f823c14`, `655be81` e `708a148`.

Essa varredura por padrões não é uma garantia universal de ausência de segredos. A conclusão específica dos quatro incidentes acima se baseia na correspondência com o valor e a localização mostrados pelo GitGuardian e no uso comprovado pelo código. Arquivos `.env` locais não foram acessados, valores não foram enviados a um scanner externo e nenhuma credencial de serviço foi revogada ou alterada.
