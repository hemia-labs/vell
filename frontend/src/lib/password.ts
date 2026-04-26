const LOWERCASE = 'abcdefghijkmnopqrstuvwxyz'
const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const DIGITS = '23456789'
const SPECIALS = '@$!%*?&'
const PASSWORD_ALPHABET = `${LOWERCASE}${UPPERCASE}${DIGITS}${SPECIALS}`

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/

function pickRandom(source: string) {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)

  return source[values[0] % source.length]
}

function shufflePassword(characters: string[]) {
  const values = new Uint32Array(characters.length)
  crypto.getRandomValues(values)

  return characters
    .map((character, index) => ({ character, order: values[index] }))
    .sort((left, right) => left.order - right.order)
    .map(({ character }) => character)
    .join('')
}

export function generatePassword(length = 16) {
  const safeLength = Math.max(length, 8)
  const characters = [
    pickRandom(LOWERCASE),
    pickRandom(UPPERCASE),
    pickRandom(DIGITS),
    pickRandom(SPECIALS)
  ]

  while (characters.length < safeLength) {
    characters.push(pickRandom(PASSWORD_ALPHABET))
  }

  return shufflePassword(characters)
}
