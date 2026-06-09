/**
 * @fileOverview Logic to derive visual themes based on character class and race.
 */

export type CharacterTheme = 'institutional' | 'mago' | 'guerreiro' | 'goblin' | 'bruxo-sucata';

export function getCharacterTheme(charClass?: string, race?: string): CharacterTheme {
  const c = charClass?.toLowerCase() || '';
  const r = race?.toLowerCase() || '';

  // Special Combinations
  if (c === 'mago' && r === 'goblin') return 'bruxo-sucata';
  if (c === 'wizard' && r === 'goblin') return 'bruxo-sucata';

  // Class Based
  if (c === 'mago' || c === 'wizard') return 'mago';
  if (c === 'guerreiro' || c === 'fighter') return 'guerreiro';
  
  // Race Based
  if (r === 'goblin') return 'goblin';

  return 'institutional';
}