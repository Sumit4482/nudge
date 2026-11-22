import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, PrimaryButton } from '@/components/ui';
import { toast } from '@/lib/toast';
import { useApp } from '@/store/useApp';
import { signIn, signOut } from '@/wall/api';
import { processWallQueue } from '@/wall/queue';
import { useWallSession } from '@/wall/useSession';
import { FONT, usePhase } from '@/theme';

const DELAYS = [0, 15, 30, 60, 120, 240];

/** Sign in to your proof wall, set the posting delay, and push waiting photos. */
export function WallSection() {
  const { palette } = usePhase();
  const session = useWallSession();
  const delay = useApp((s) => s.wallDelay);
  const setDelay = useApp((s) => s.setWallDelay);
  const queued = useApp((s) => s.wallQueue.length);
  const note = useApp((s) => s.wallNote);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const input = [styles.input, { borderColor: palette.line, color: palette.ink, backgroundColor: palette.card }];

  if (!session.configured) {
    return (
      <Card style={styles.block}>
        <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 13, lineHeight: 19 }}>
          The proof wall is not set up yet. Follow supabase/README.md, add your project URL and key to .env, and restart the app. Until then proofs stay private on this phone.
        </Text>
      </Card>
    );
  }

  return (
    <Card style={styles.block}>
      {session.userId ? (
        <>
          <Text style={{ color: palette.ink, fontFamily: FONT.bodySemi, fontSize: 14.5 }}>{`Signed in as ${session.email ?? 'you'}`}</Text>
          <Text style={{ color: palette.mute, fontFamily: FONT.bodySemi, fontSize: 11.5, letterSpacing: 1 }}>POSTING DELAY</Text>
          <View style={styles.wrap}>
            {DELAYS.map((m) => (
              <Pressable key={m} accessibilityRole="button" onPress={() => setDelay(m)} style={[styles.chip, { backgroundColor: delay === m ? palette.accent : palette.line }]}>
                <Text style={{ color: delay === m ? palette.onAccent : palette.ink, fontFamily: FONT.mono, fontSize: 12.5 }}>{m === 0 ? 'None' : `${m} min`}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 12.5, lineHeight: 18 }}>
            A proof appears on the public page this long after you finish. The delay keeps the page from showing where you are right now.
          </Text>
          <PrimaryButton
            label={queued ? `Upload ${queued} waiting` : 'Nothing waiting'}
            disabled={!queued || busy}
            onPress={async () => {
              setBusy(true);
              const n = await processWallQueue();
              setBusy(false);
              toast(n ? `${n} uploaded.` : 'Could not upload. Check your connection.');
            }}
          />
          <Pressable accessibilityRole="button" onPress={() => signOut()} style={{ alignSelf: 'center', padding: 8 }}>
            <Text style={{ color: palette.mute, fontFamily: FONT.bodySemi, fontSize: 13 }}>Sign out</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 13, lineHeight: 18 }}>Sign in with the email and password you created for yourself in Supabase.</Text>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={palette.mute} style={input} accessibilityLabel="Email" />
          <TextInput value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" placeholder="Password" placeholderTextColor={palette.mute} style={input} accessibilityLabel="Password" />
          <PrimaryButton
            label="Sign in"
            disabled={busy || !email.trim() || !password}
            onPress={async () => {
              setBusy(true);
              const err = await signIn(email.trim(), password);
              setBusy(false);
              if (err) toast(err);
              else {
                setPassword('');
                toast('Signed in.');
              }
            }}
          />
        </>
      )}
      <Text selectable style={{ color: palette.mute, fontFamily: FONT.mono, fontSize: 11.5, lineHeight: 16 }}>
        {`Status: ${session.userId ? 'signed in' : 'signed out'} · ${queued} waiting\n${note || 'No proof activity yet.'}`}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  block: { padding: 16, gap: 14, marginBottom: 14, borderRadius: 24 },
  input: { height: 48, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, fontFamily: FONT.mono, fontSize: 14 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 32, paddingHorizontal: 13, borderRadius: 99, justifyContent: 'center' },
});
