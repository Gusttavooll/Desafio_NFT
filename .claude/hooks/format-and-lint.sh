#!/usr/bin/env bash
# Roda após cada edição: eslint --fix no arquivo editado.
# Usa node (em vez de jq) para ler o JSON do stdin.
file=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).tool_input?.file_path??"")}catch{}})')
[ -z "$file" ] && exit 0

# Só arquivos JS/TS e só depois de instalar as dependências.
case "$file" in
  *.ts|*.tsx|*.js|*.jsx) ;;
  *) exit 0 ;;
esac
[ -d node_modules ] || exit 0

# Se o linter falhar, exit 2 devolve o erro ao Claude para ele corrigir.
if ! out=$(npx eslint --fix "$file" 2>&1); then
  echo "$out" >&2
  exit 2
fi
exit 0
