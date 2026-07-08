export const REWARD_MESSAGES = [
  '¡Imbatible!',
  '¡Brutal!',
  '¡Uno más!',
  '¡Fuego!',
  '¡Modo Dios!',
  '¡No te detienes!',
  '¡Así se hace!',
  '¡Racha viva!',
  '¡Sin excusas!',
  '¡Imparable!',
  '¡Eso es!',
  '¡A tu ritmo, ganando!',
]

export function randomRewardMessage() {
  return REWARD_MESSAGES[Math.floor(Math.random() * REWARD_MESSAGES.length)]
}
