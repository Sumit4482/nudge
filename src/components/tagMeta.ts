import type { Ionicons } from '@expo/vector-icons';
import type { Tag } from '../types';

export type IconName = keyof typeof Ionicons.glyphMap;

export const TAG_META: Record<Tag, { label: string; icon: IconName; proof: string }> = {
  fit: { label: 'Fit', icon: 'barbell-outline', proof: 'a selfie or a photo of the gym' },
  study: { label: 'Study', icon: 'book-outline', proof: 'a photo of your notes or the page' },
  life: { label: 'Life', icon: 'list-outline', proof: 'a photo of the finished result' },
};
