import type { ProfileInput } from "../lib/contracts.ts";
import { validateProfile } from "../lib/model.ts";

export type ProfileField = keyof ProfileInput;
export type ProfileFormError = { field: ProfileField; message: string };
const errorFields: Record<string, ProfileField> = {
  "Profile contains unsupported fields.": "name",
  "Enter a first name of 1–40 characters.": "name",
  "MakeIn is for adults aged 18–100. Enter a valid birth date.": "birthDate",
  "Choose a gender.": "gender",
  "Choose who you want to meet.": "interestedIn",
  "Enter a city of 1–80 characters.": "location",
  "Write a bio of 1–500 characters.": "bio",
  "Add 1–6 uploaded HTTPS photos.": "photos",
  "Choose 1–8 different interests.": "interests",
  "Choose what you are looking for.": "intent",
  "Use up to 3 prompts with a question and answer.": "prompts",
};

export function profileFormError(input: ProfileInput, unresolvedPhotos = 0): ProfileFormError | null {
  const message = validateProfile(input);
  const field = message ? errorFields[message] ?? "name" : null;
  // Keep the first visible invalid field; local photos still block saving even
  // when the uploaded subset already satisfies the model's photo contract.
  const beforePhotos: ProfileField[] = ["name", "birthDate", "gender", "interestedIn", "location", "bio"];
  if (unresolvedPhotos && (!field || !beforePhotos.includes(field))) {
    return { field: "photos", message: "Finish uploading or remove the selected photos before saving." };
  }
  if (!message) return null;
  return {
    field: errorFields[message] ?? "name",
    message: message === "Add 1–6 uploaded HTTPS photos." ? "Add at least one photo of yourself." : message,
  };
}

export function makeMainPhoto<T>(photos: T[], index: number): T[] {
  if (index <= 0 || index >= photos.length) return photos;
  return [photos[index], ...photos.filter((_, current) => current !== index)];
}
