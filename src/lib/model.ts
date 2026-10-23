import type { Card, Filters, Membership, Profile, ProfileInput } from './contracts';
const genders = ['Woman', 'Man', 'Non-binary'];
const intents = ['A relationship', 'Something casual', 'Figuring it out'];
export const emptyProfileInput: ProfileInput = { name: '', birthDate: '', gender: 'Woman', interestedIn: [], location: '', bio: '', photos: [], interests: [], intent: 'A relationship', prompts: [] };
export function ageFromBirthDate(value: string, now = new Date()): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const birth = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(birth.getTime()) || birth.toISOString().slice(0, 10) !== value) return NaN;
  return now.getUTCFullYear() - birth.getUTCFullYear() - Number(now.getUTCMonth() < birth.getUTCMonth() || (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate()));
}
const boundedText = (value: unknown, min: number, max: number): value is string => typeof value === 'string' && value.trim().length >= min && value.length <= max;
export function persistentPhoto(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try { const url = new URL(value); return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password; } catch { return false; }
}
export function validateProfile(input: ProfileInput, now = new Date()): string | null {
  const keys = ['name', 'birthDate', 'gender', 'interestedIn', 'location', 'bio', 'photos', 'interests', 'intent', 'prompts'];
  if (!input || Object.keys(input).length !== keys.length || Object.keys(input).some(k => !keys.includes(k))) return 'Profile contains unsupported fields.';
  if (!boundedText(input.name, 1, 40)) return 'Enter a first name of 1–40 characters.';
  const age = ageFromBirthDate(input.birthDate, now);
  if (!Number.isInteger(age) || age < 18 || age > 100) return 'MakeIn is for adults aged 18–100. Enter a valid birth date.';
  if (!genders.includes(input.gender)) return 'Choose a gender.';
  if (!Array.isArray(input.interestedIn) || input.interestedIn.length < 1 || input.interestedIn.length > 3 || new Set(input.interestedIn).size !== input.interestedIn.length || input.interestedIn.some(g => !genders.includes(g))) return 'Choose who you want to meet.';
  if (!boundedText(input.location, 1, 80)) return 'Enter a city of 1–80 characters.';
  if (!boundedText(input.bio, 1, 500)) return 'Write a bio of 1–500 characters.';
  if (!Array.isArray(input.photos) || input.photos.length < 1 || input.photos.length > 6 || input.photos.some(p => !persistentPhoto(p))) return 'Add 1–6 uploaded HTTPS photos.';
  if (!Array.isArray(input.interests) || input.interests.length < 1 || input.interests.length > 8 || new Set(input.interests).size !== input.interests.length || input.interests.some(i => !boundedText(i, 1, 30))) return 'Choose 1–8 different interests.';
  if (!intents.includes(input.intent)) return 'Choose what you are looking for.';
  if (!Array.isArray(input.prompts) || input.prompts.length > 3 || input.prompts.some(p => !p || Object.keys(p).length !== 2 || !boundedText(p.question, 1, 100) || !boundedText(p.answer, 1, 200))) return 'Use up to 3 prompts with a question and answer.';
  return null;
}
export function swipeDirection(dx: number, vx: number): 'like' | 'pass' | null {
  if (!Number.isFinite(dx) || !Number.isFinite(vx)) return null;
  if (Math.abs(dx) >= 120 || (Math.abs(dx) >= 25 && Math.abs(vx) >= 0.65 && Math.sign(dx) === Math.sign(vx))) return dx > 0 ? 'like' : 'pass';
  return null;
}
export function canonicalPair(a: string, b: string): { id: string; members: string[] } {
  if (!a || !b || a === b || [a, b].some(id => /[~/]/.test(id))) throw new Error('Invalid match members.');
  const members = [a, b].sort(); return { id: members.join('~'), members };
}
export function filterCards(cards: Card[], profile: Profile, filters: Filters): Card[] {
  const city = filters.location.trim().toLocaleLowerCase();
  return cards.filter(c => c.status === 'active' && c.age >= Math.max(18, filters.minAge) && c.age <= Math.min(100, filters.maxAge) && profile.interestedIn.includes(c.gender) && c.interestedIn.includes(profile.gender) && (!city || c.location.toLocaleLowerCase().includes(city)));
}
export function membershipActive(m: Membership | null, now = Date.now()): boolean { return !!m && (m.status === 'active' || m.status === 'cancelled') && Number.isFinite(m.currentPeriodEnd) && m.currentPeriodEnd > now; }
export function addCalendarMonth(value: Date): Date {
  const date = new Date(value); const day = date.getUTCDate(); date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + 1);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate(); date.setUTCDate(Math.min(day, last)); return date;
}
