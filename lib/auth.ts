// Generate a unique family code
export function generateFamilyCode(): string {
  const adjectives = ['Epic', 'Brave', 'Noble', 'Swift', 'Wise', 'Bold', 'Fierce', 'Loyal'];
  const nouns = ['Knights', 'Dragons', 'Wizards', 'Rangers', 'Heroes', 'Guards', 'Legends', 'Warriors'];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;

  return `${adjective}${noun}${number}`;
}