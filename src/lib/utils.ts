import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CAMPUS_CENTER = { lat: 37.5510, lng: 126.9250 };
export const CAMPUS_ZOOM = 16.5;

export const BUILDINGS = [
  { name: "본관 (A동)", lat: 37.5518, lng: 126.9255 },
  { name: "공학관 (B동)", lat: 37.5505, lng: 126.9238 },
  { name: "IT관 (C동)", lat: 37.5508, lng: 126.9230 },
  { name: "인문관 (D동)", lat: 37.5512, lng: 126.9245 },
  { name: "사회과학관 (E동)", lat: 37.5515, lng: 126.9240 },
  { name: "중앙도서관 (F동)", lat: 37.5510, lng: 126.9250 },
  { name: "학생회관 (G동)", lat: 37.5500, lng: 126.9245 },
  { name: "체육관 (H동)", lat: 37.5495, lng: 126.9255 },
  { name: "미술관 (I동)", lat: 37.5520, lng: 126.9265 },
  { name: "미래관 (J동)", lat: 37.5502, lng: 126.9225 }
];