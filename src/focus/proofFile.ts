import { Directory, File, Paths } from 'expo-file-system';

/** Copy a picked file into the app's own folder so it survives cache clears. Returns the new uri. */
export async function saveProofFile(sourceUri: string, ext: string): Promise<string> {
  const dir = new Directory(Paths.document, 'proofs');
  dir.create({ intermediates: true, idempotent: true });
  const dest = new File(dir, `proof-${Date.now()}.${ext}`);
  await new File(sourceUri).copy(dest);
  return dest.uri;
}

export const saveProofPhoto = (sourceUri: string) => saveProofFile(sourceUri, 'jpg');
