/** Change the name here and it updates everywhere. */
export const SITE = {
  name: 'Sumit',
  title: 'Sumit: small steps, quietly done',
  description: 'A calm record of what Sumit finishes each day, with a photo for every one.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
};

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
