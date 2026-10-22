import type { Card, Profile, ProfileInput, Gender, Intent } from './contracts';
const portraits = ['photo-1534528741775-53994a69daeb', 'photo-1500648767791-00dcc994a43e', 'photo-1524504388940-b1c1722653e1', 'photo-1506794778202-cad84cf45f1d', 'photo-1524250502761-1ac6f2e30d43', 'photo-1517841905240-472988babdf9', 'photo-1519085360753-af0119f7cbe7', 'photo-1526510747491-58f928ec870f', 'photo-1531123897727-8f129e1688ce', 'photo-1506794778202-cad84cf45f1d'];
const people: [string, number, Gender, string, string, string[], Intent][] = [
  ['Aanya', 26, 'Woman', 'Bengaluru', 'Bookshop detours, filter coffee and a very optimistic balcony garden.', ['Books', 'Coffee', 'Gardening'], 'A relationship'],
  ['Kabir', 29, 'Man', 'Mumbai', 'A weekend cook with an unnecessarily long playlist for every recipe.', ['Cooking', 'Music', 'Travel'], 'A relationship'],
  ['Mira', 25, 'Non-binary', 'Bengaluru', 'Collecting little sketches of ordinary days. Come find a new gallery with me.', ['Art', 'Design', 'Coffee'], 'Figuring it out'],
  ['Rohan', 31, 'Man', 'Delhi', 'Usually planning a hike or looking for the next great street food stop.', ['Hiking', 'Food', 'Photography'], 'A relationship'],
  ['Tara', 27, 'Woman', 'Pune', 'Live music, Sunday markets and conversations that forget the time.', ['Music', 'Markets', 'Dogs'], 'Something casual'],
  ['Leela', 30, 'Woman', 'Chennai', 'A beach walk before the city wakes up is my favourite reset.', ['Running', 'Beach', 'Books'], 'A relationship'],
  ['Dev', 28, 'Man', 'Bengaluru', 'Badminton beginner, enthusiastic breakfast finder, patient museum companion.', ['Badminton', 'Food', 'Museums'], 'Figuring it out'],
  ['Noor', 26, 'Non-binary', 'Hyderabad', 'Trying one new thing a month. This month: pottery and keeping the clay on the wheel.', ['Pottery', 'Cinema', 'Travel'], 'A relationship'],
  ['Isha', 24, 'Woman', 'Mumbai', 'Tell me your favourite comfort movie. I will probably bring the popcorn.', ['Cinema', 'Dance', 'Food'], 'Something casual'],
  ['Arjun', 33, 'Man', 'Kochi', 'Slow travel, long swims and making time for the people who matter.', ['Swimming', 'Travel', 'Cooking'], 'A relationship'],
];
export const demoCards: Card[] = people.map(([name, age, gender, location, bio, interests, intent], index) => ({ id: `demo-${index + 1}`, demo: true, name, age, gender, location, bio, interests, intent, interestedIn: ['Woman', 'Man', 'Non-binary'], photos: [`https://images.unsplash.com/${portraits[index]}?auto=format&fit=crop&w=900&q=85`], prompts: [{ question: 'A small joy', answer: 'A walk with nowhere particular to be.' }], status: 'active' }));
export const demoProfileInput: ProfileInput = { name: 'You', birthDate: '1999-04-16', gender: 'Non-binary', interestedIn: ['Woman', 'Man', 'Non-binary'], location: 'Bengaluru', bio: 'Here for kind people and good conversations.', photos: ['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=900&q=85'], interests: ['Coffee', 'Travel', 'Art'], intent: 'A relationship', prompts: [] };
const { birthDate: _birthDate, ...demoPublic } = demoProfileInput;
export const demoProfile: Profile = { ...demoPublic, age: 27, status: 'active' };
