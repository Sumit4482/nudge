import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, SectionTitle } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { FONT, usePhase } from '@/theme';
import { fetchCheers, type Cheer } from '@/wall/cheers';
import { useWallSession } from '@/wall/useSession';

const SHOWN = 6;

function ago(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

/** Who has cheered you on from the proof wall. New ones are marked until you leave this tab. */
export function CheersCard() {
  const { palette } = usePhase();
  const { userId } = useWallSession();
  const focused = useIsFocused();
  const seen = useApp((s) => s.cheersSeen);
  const [cheers, setCheers] = useState<Cheer[] | null>(null);
  const [seenAtOpen, setSeenAtOpen] = useState(seen);
  const latest = useRef('');

  useEffect(() => {
    if (!userId || !focused) return;
    let alive = true;
    (async () => {
      setSeenAtOpen(useApp.getState().cheersSeen);
      const list = await fetchCheers();
      if (!alive) return;
      latest.current = list[0]?.created_at ?? '';
      setCheers(list);
    })();
    return () => {
      alive = false;
      // Leaving the tab counts as having seen them.
      if (latest.current) useApp.getState().markCheersSeen(latest.current);
    };
  }, [userId, focused]);

  if (!userId) return null;
  const fresh = (cheers ?? []).filter((c) => c.created_at > seenAtOpen).length;

  return (
    <>
      <SectionTitle>Cheers</SectionTitle>
      <Card style={styles.block}>
        <View style={styles.head}>
          <Ionicons name="heart-outline" size={18} color={palette.ink} />
          <Text style={{ flex: 1, color: palette.ink, fontFamily: FONT.display, fontSize: 17 }}>
            {cheers == null ? 'Cheers' : cheers.length ? `${cheers.length}${cheers.length >= 20 ? '+' : ''} cheer${cheers.length === 1 ? '' : 's'}` : 'No cheers yet'}
          </Text>
          {fresh ? (
            <View style={[styles.pill, { backgroundColor: palette.accent }]}>
              <Text style={{ color: palette.onAccent, fontFamily: FONT.bodyBold, fontSize: 11 }}>{`${fresh} NEW`}</Text>
            </View>
          ) : null}
        </View>
        {cheers && cheers.length ? (
          cheers.slice(0, SHOWN).map((c) => (
            <View key={c.id} style={styles.line}>
              <Text style={{ flex: 1, color: palette.ink, fontFamily: c.created_at > seenAtOpen ? FONT.bodySemi : FONT.body, fontSize: 14 }} numberOfLines={1}>
                {c.name ?? 'Someone'}
              </Text>
              <Text style={{ color: palette.mute, fontFamily: FONT.mono, fontSize: 12 }}>{ago(c.created_at)}</Text>
            </View>
          ))
        ) : cheers ? (
          <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 13.5, lineHeight: 19 }}>
            Visitors can cheer from your proof wall and leave a name. They show up here.
          </Text>
        ) : null}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  block: { padding: 18, marginBottom: 12, borderRadius: 26, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: { height: 22, paddingHorizontal: 9, borderRadius: 11, justifyContent: 'center' },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
