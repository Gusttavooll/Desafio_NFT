#!/usr/bin/env bash
# Bloqueia comandos perigosos. Exit 2 = bloqueia e avisa o Claude.
# Usa node (em vez de jq) para ler o JSON do stdin.
cmd=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).tool_input?.command??"")}catch{}})')

patterns=(
  'rm -rf /'
  'rm -rf ~'
  'git push --force'
  'git push -f'
  'git reset --hard origin'
  'DROP TABLE'
  'DROP DATABASE'
  '> /dev/sda'
  'chmod -R 777'
)

for p in "${patterns[@]}"; do
  if [[ "$cmd" == *"$p"* ]]; then
    echo "Bloqueado pelo hook: comando contém '$p'. Peça confirmação ao usuário." >&2
    exit 2
  fi
done
exit 0
