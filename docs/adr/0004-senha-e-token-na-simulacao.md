# 0004. Senha com hash e token de Sessão opaco na simulação

- Status: aceito
- Data: 2026-10-21

## Contexto
Mesmo sem backend real, o produto não deve tratar credenciais de forma descuidada: a senha nunca pode ficar em claro, nem no estado simulado persistido. Resolve a pendência 5 de `docs/architecture.md`.

## Decisão
1. A senha é guardada como hash SHA-256 de `salt:senha`, calculado com Web Crypto, com um salt por Colecionador. O estado simulado só contém `salt` e `passwordHash`.
2. O token de Sessão é opaco: 32 bytes aleatórios em hexadecimal, associado no estado ao Colecionador e a uma data de expiração.
3. O cliente envia o token em `Authorization: Bearer <token>`. O helper `requireSession` resolve o Colecionador ou responde `401 session_expired` (token ausente, desconhecido ou vencido).
4. As Fixtures guardam apenas o hash. As senhas fictícias dos dois Colecionadores de teste ficam documentadas no README, e um teste confere que elas batem com o hash.

## Alternativas consideradas
- Senha em claro nas Fixtures: simples, mas contraria a spec e normaliza um mau hábito.
- bcrypt ou Argon2: exigiriam dependência nova, sem ganho real numa simulação.
- JWT: o conteúdo do token não precisa ser legível pelo cliente.

## Consequências
- SHA-256 com salt não é adequado para produção; aqui só demonstra o cuidado com credenciais.
- O login e o cadastro (contexto Conta e Sessão) usam `hashPassword`, `verifyPassword`, `generateSalt` e `generateToken` do núcleo de mocks.
