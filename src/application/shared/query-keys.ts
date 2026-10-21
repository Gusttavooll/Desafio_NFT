// Toda query key começa pelo escopo do usuário, isolando o cache entre colecionadores e visitante.
// `userId` null representa o visitante.
export function scopedQueryKey<const TParts extends readonly unknown[]>(userId: string | null, ...parts: TParts) {
  return userId === null ? (['guest', ...parts] as const) : (['user', userId, ...parts] as const)
}
