import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated as RNAnimated, Image, PanResponder, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { Easing, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { SectionTitle, TagIcon } from '@/components/ui';
import { TAG_META } from '@/components/tagMeta';
import { toast } from '@/lib/toast';
import { MY_TIMES } from '@/lib/times';
import { dur, fmt } from '@/planner';
import { buildPlan } from '@/store/selectors';
import { useApp } from '@/store/useApp';
import { EASE, FONT, TAG_COLORS, usePhase } from '@/theme';
import type { Block, PlanOutput, Task } from '@/types';

type TaskBlock = Extract<Block, { kind: 'task' }>;
type Props = { plan: PlanOutput; now: number; dow: number; date: string; onOpenTask?: (id: string) => void };
interface RowBox {
  y: number;
  h: number;
  s: number;
  e: number;
  kind: Block['kind'];
}

const ease = Easing.bezier(...EASE);
/** Rows glide to their new place when the plan changes, and fade in from below. */
const layout = LinearTransition.duration(900).easing(ease);
const enter = (i: number) => FadeInDown.duration(700).delay(Math.min(i, 9) * 60).easing(ease);
const exit = FadeOut.duration(300);
const WHEN = { wake: 'I wake up', leave: 'I leave', home: "I'm home" } as const;

function Row({
  time,
  sub,
  pred,
  next,
  index,
  box,
  onBox,
  boxKey,
  children,
}: {
  time: string;
  sub?: string;
  pred?: boolean;
  next?: boolean;
  index: number;
  box?: Omit<RowBox, 'y' | 'h'>;
  boxKey?: string;
  onBox?: (key: string, b: RowBox) => void;
  children: ReactNode;
}) {
  const { palette } = usePhase();
  const onLayout = (e: LayoutChangeEvent) => {
    if (box && boxKey && onBox) onBox(boxKey, { ...box, y: e.nativeEvent.layout.y, h: e.nativeEvent.layout.height });
  };
  return (
    <Animated.View style={styles.row} layout={layout} entering={enter(index)} exiting={exit} onLayout={onLayout}>
      <View style={styles.time}>
        <Text style={{ color: palette.hero, fontFamily: FONT.mono, fontSize: 13 }}>{time}</Text>
        {sub ? <Text style={{ color: palette.heroMute, fontFamily: FONT.monoRegular, fontSize: 11 }}>{sub}</Text> : null}
      </View>
      <View style={styles.rail}>
        <View style={[styles.line, { backgroundColor: palette.line }]} />
        <View
          style={[
            styles.dot,
            {
              borderColor: pred ? palette.heroMute : palette.accent,
              borderStyle: pred ? 'dashed' : 'solid',
              backgroundColor: next ? palette.accent : palette.sky[0],
            },
          ]}
        />
      </View>
      <View style={styles.cardCol}>{children}</View>
    </Animated.View>
  );
}

function MiniChip({ icon, label, onPress, tint }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void; tint?: boolean }) {
  const { palette } = usePhase();
  const bg = tint ? `${palette.accent}2E` : palette.line;
  const fg = tint ? palette.accent : palette.mute;
  const body = (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={11} color={fg} />
      <Text style={{ color: fg, fontFamily: FONT.bodySemi, fontSize: 11 }}>{label}</Text>
    </View>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

/** A grip you drag up or down to pin a task to a time. */
function Grip({ onDrag, onRelease, color }: { onDrag: (dy: number) => void; onRelease: (dy: number) => void; color: string }) {
  const handlers = useRef({ onDrag, onRelease });
  useEffect(() => {
    handlers.current = { onDrag, onRelease };
  });
  // The handlers only read the latest callbacks when a drag happens, never during render.
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_e, g) => handlers.current.onDrag(g.dy),
      onPanResponderRelease: (_e, g) => handlers.current.onRelease(g.dy),
      onPanResponderTerminate: () => handlers.current.onRelease(0),
    }),
  );
  return (
    <View {...pan.panHandlers} style={styles.grip} accessibilityLabel="Drag to move">
      <Ionicons name="reorder-three-outline" size={20} color={color} />
    </View>
  );
}

function TaskCard({ b, next, onPress, onDrop }: { b: TaskBlock; next: boolean; onPress?: () => void; onDrop: (id: string, dy: number) => void }) {
  const { palette } = usePhase();
  const t = b.t;
  const [ty] = useState(() => new RNAnimated.Value(0));
  const sub = t.steps ? `${t.steps.length} steps · first: ${t.steps[0]}` : `${TAG_META[t.tag].label}${t.routine ? ' · repeats' : ''}${t.chore ? ' · rotation' : ''}${t.review ? ' · review' : ''}`;
  const unpin = () => useApp.getState().pinTask(t.id, null);
  const hasChips = b.pinned || t.trigger || t.stake || t.rolled > 0;
  return (
    <RNAnimated.View style={{ transform: [{ translateY: ty }], zIndex: 5 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t.title}, ${dur(t.mins)}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          b.pred ? { borderWidth: 1.5, borderStyle: 'dashed', borderColor: palette.line } : { backgroundColor: palette.card },
          next && { paddingTop: 28, borderWidth: 1.5, borderColor: `${palette.accent}66` },
          { transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        {next ? <Text style={[styles.eyebrow, { color: palette.accent, fontFamily: FONT.bodySemi }]}>NEXT UP</Text> : null}
        {t.must && !next ? <Text style={[styles.must, { color: palette.mute, fontFamily: FONT.bodySemi }]}>MUST</Text> : null}
        <View style={styles.cardMain}>
          <TagIcon tag={t.tag} />
          <View style={styles.cardText}>
            <Text numberOfLines={2} style={{ color: palette.ink, fontFamily: FONT.display, fontSize: 15.5, lineHeight: 19 }}>
              {t.title}
            </Text>
            <Text numberOfLines={1} style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 12.5, marginTop: 2 }}>
              {sub}
            </Text>
          </View>
          {next ? (
            <View style={[styles.go, { backgroundColor: palette.accent }]}>
              <Text style={{ color: palette.onAccent, fontFamily: FONT.bodyBold, fontSize: 13 }}>Start</Text>
            </View>
          ) : null}
          <Grip color={palette.mute} onDrag={(dy) => ty.setValue(dy)} onRelease={(dy) => { ty.setValue(0); onDrop(t.id, dy); }} />
        </View>
        {hasChips ? (
          <View style={styles.chips}>
            {b.pinned ? <MiniChip icon="pin-outline" label={`Pinned ${fmt(b.s)} ✕`} onPress={unpin} /> : null}
            {t.trigger ? <MiniChip icon="flash-outline" label={`When ${WHEN[t.trigger.when]}`} /> : null}
            {t.stake ? <MiniChip icon="shield-outline" label="Staked" tint /> : null}
            {t.rolled > 0 ? <MiniChip icon="repeat" label={`Skipped ${t.rolled}x`} /> : null}
          </View>
        ) : null}
      </Pressable>
    </RNAnimated.View>
  );
}

function SimpleCard({ icon, title, body, bar, dashed, onPress }: { icon?: keyof typeof Ionicons.glyphMap; title: string; body?: string; bar?: number; dashed?: boolean; onPress?: () => void }) {
  const { palette } = usePhase();
  return (
    <Pressable
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={title}
      onPress={onPress}
      style={[styles.card, dashed ? { borderWidth: 1.5, borderStyle: 'dashed', borderColor: palette.line } : { backgroundColor: palette.card }]}
    >
      <View style={styles.cardMain}>
        {icon ? (
          <View style={[styles.iconBox, { backgroundColor: palette.line }]}>
            <Ionicons name={icon} size={18} color={palette.ink} />
          </View>
        ) : null}
        <View style={styles.cardText}>
          <Text style={{ color: palette.ink, fontFamily: dashed ? FONT.body : FONT.display, fontSize: dashed ? 14 : 15.5 }}>{title}</Text>
          {body ? <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 12.5, marginTop: 2 }}>{body}</Text> : null}
        </View>
        {onPress ? <Ionicons name="chevron-forward" size={18} color={palette.mute} /> : null}
      </View>
      {bar != null ? (
        <View style={[styles.bar, { backgroundColor: palette.line }]}>
          <View style={{ width: `${bar * 100}%`, height: '100%', backgroundColor: palette.accent, borderRadius: 5 }} />
        </View>
      ) : null}
    </Pressable>
  );
}

export function Timeline({ plan, now, dow, date, onOpenTask }: Props) {
  const { palette } = usePhase();
  const today = useApp((s) => s.date);
  const allDone = useApp((s) => s.done);
  const done = useMemo(() => allDone.filter((d) => d.date === today), [allDone, today]);
  // Tasks with no slot left stay on today until the day ends. Only ones you moved yourself wait for tomorrow.
  const leftToday = plan.later.filter((t: Task) => !t.tomorrow);
  const movedTomorrow = plan.later.filter((t: Task) => t.tomorrow);
  const next = plan.blocks.find((b) => b.kind === 'task' && !b.pred) as TaskBlock | undefined;
  const boxes = useRef<Record<string, RowBox>>({});
  const onBox = (key: string, b: RowBox) => {
    boxes.current[key] = b;
  };

  /** Dropping a task on a row pins it to that time, if the planner can fit it there. */
  const handleDrop = (id: string, dy: number) => {
    const me = boxes.current[id];
    if (!me || Math.abs(dy) < 24) return;
    const centerY = me.y + me.h / 2 + dy;
    let best: RowBox | null = null;
    let bd = Infinity;
    for (const [k, l] of Object.entries(boxes.current)) {
      if (k === id || l.kind === 'office' || l.kind === 'now') continue;
      const d = Math.abs(l.y + l.h / 2 - centerY);
      if (d < bd) {
        bd = d;
        best = l;
      }
    }
    if (!best) return;
    const after = centerY > best.y + best.h / 2;
    const target = Math.round((after ? best.e + 10 : best.s) / 5) * 5;
    const st = useApp.getState();
    st.pinTask(id, target);
    const ok = buildPlan(useApp.getState(), now, dow, date).placed.some((b) => b.t.id === id && b.pinned);
    if (!ok) {
      st.pinTask(id, null);
      toast('No room there. It snapped back.');
    } else toast(`Pinned to ${fmt(target)}. Everything else flows around it.`);
  };

  return (
    <View>
      {plan.blocks.map((b, i) => {
        switch (b.kind) {
          case 'now':
            return (
              <Animated.View key="now" style={[styles.row, { marginBottom: 2 }]} layout={layout} entering={enter(i)} exiting={exit}>
                <View style={styles.time}>
                  <Text style={{ color: palette.accent, fontFamily: FONT.mono, fontSize: 13 }}>{fmt(b.s)}</Text>
                </View>
                <View style={styles.rail}>
                  <View style={[styles.nowDot, { backgroundColor: palette.accent }]} />
                </View>
                <View style={styles.nowLine}>
                  <Text style={{ color: palette.accent, fontFamily: FONT.bodySemi, fontSize: 10.5, letterSpacing: 1.4 }}>NOW</Text>
                  <View style={{ flex: 1, height: 1.5, backgroundColor: palette.accent, opacity: 0.5 }} />
                </View>
              </Animated.View>
            );
          case 'office': {
            const pct = Math.max(0, Math.min(1, (now - b.s) / (b.e - b.s)));
            const early = MY_TIMES.home - b.e;
            const body = b.done
              ? `Done ${fmt(b.s)}–${fmt(b.e)}${early > 0 ? ` · ${dur(early)} earlier than usual` : early < 0 ? ` · ${dur(-early)} later than usual` : ''}`
              : b.active
                ? `At office · expecting you home ~${fmt(b.e)}`
                : `~${fmt(b.s)} → ~${fmt(b.e)} · tap when you leave`;
            return (
              <Row key="office" index={i} time={`${b.pred ? '~' : ''}${fmt(b.s)}`} sub={dur(b.e - b.s)} boxKey="office" box={{ s: b.s, e: b.e, kind: 'office' }} onBox={onBox}>
                <SimpleCard icon="briefcase-outline" title="Office" body={body} bar={b.active ? pct : undefined} />
              </Row>
            );
          }
          case 'busy':
            return (
              <Row key={`busy${b.i}`} index={i} time={fmt(b.s)} sub={dur(b.e - b.s)} boxKey={`busy${b.i}`} box={{ s: b.s, e: b.e, kind: 'busy' }} onBox={onBox}>
                <SimpleCard icon="calendar-outline" title={b.title} body="From your calendar. Tasks flow around it." />
              </Row>
            );
          case 'free':
            return (
              <Row key={`free-${b.w}${b.i}`} index={i} time={`${b.pred ? '~' : ''}${fmt(b.s)}`} sub={dur(b.e - b.s)} pred boxKey={`free-${b.w}${b.i}`} box={{ s: b.s, e: b.e, kind: 'free' }} onBox={onBox}>
                <SimpleCard
                  dashed
                  title={`Free · ${dur(b.e - b.s)} open`}
                  body="Tap and tell me what you're doing"
                  onPress={() => router.push({ pathname: '/checkin', params: { s: String(b.s), e: String(b.e) } })}
                />
              </Row>
            );
          default:
            return (
              <Row
                key={b.t.id}
                index={i}
                time={`${b.pred ? '~' : ''}${fmt(b.s)}`}
                sub={dur(b.t.mins)}
                pred={b.pred}
                next={next?.t.id === b.t.id}
                boxKey={b.t.id}
                box={{ s: b.s, e: b.e, kind: 'task' }}
                onBox={onBox}
              >
                <TaskCard b={b} next={next?.t.id === b.t.id} onPress={onOpenTask ? () => onOpenTask(b.t.id) : undefined} onDrop={handleDrop} />
              </Row>
            );
        }
      })}

      {leftToday.length ? (
        <View style={{ gap: 8, marginBottom: 8 }}>
          <SectionTitle>{`Still today · ${leftToday.length}`}</SectionTitle>
          {leftToday.map((t: Task) => (
            <SimpleCard
              key={t.id}
              icon="time-outline"
              title={t.title}
              body={`${dur(t.mins)} · No slot left. Do it any time before the day ends.`}
              onPress={onOpenTask ? () => onOpenTask(t.id) : undefined}
            />
          ))}
        </View>
      ) : null}

      {movedTomorrow.length ? (
        <View style={[styles.later, { backgroundColor: palette.card }]}>
          <Text style={{ color: palette.ink, fontFamily: FONT.display, fontSize: 14 }}>Moved to tomorrow</Text>
          {movedTomorrow.map((t: Task) => (
            <View key={t.id} style={styles.laterRow}>
              <Text numberOfLines={1} style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 13, flex: 1 }}>{t.title}</Text>
              <Text style={{ color: palette.mute, fontFamily: FONT.mono, fontSize: 12 }}>{dur(t.mins)}</Text>
            </View>
          ))}
          <Text style={{ color: palette.mute, fontFamily: FONT.body, fontSize: 12.5 }}>You moved these. They go first tomorrow.</Text>
        </View>
      ) : null}

      {done.length ? (
        <View>
          <SectionTitle>{`Done today · ${done.length}`}</SectionTitle>
          {done.map((d) => (
            <View key={d.id} style={[styles.doneItem, { backgroundColor: palette.card }]}>
              {d.proofUri ? (
                <Image source={{ uri: d.proofUri }} style={styles.thumb} accessibilityLabel={`Proof for ${d.title}`} />
              ) : (
                <View style={[styles.thumb, { backgroundColor: `${TAG_COLORS[d.tag]}33`, alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name={d.audioUri ? 'mic-outline' : 'checkmark'} size={18} color={TAG_COLORS[d.tag]} />
                </View>
              )}
              <Text numberOfLines={1} style={{ flex: 1, color: palette.ink, fontFamily: FONT.bodySemi, fontSize: 14, textDecorationLine: 'line-through' }}>
                {d.title}
              </Text>
              <Text style={{ color: '#3F9F7F', fontFamily: FONT.mono, fontSize: 12.5 }}>{`+${d.xp}`}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  time: { width: 54, alignItems: 'flex-end', paddingTop: 15 },
  rail: { width: 16, alignItems: 'center' },
  line: { position: 'absolute', top: 0, bottom: -12, width: 2 },
  dot: { marginTop: 19, width: 12, height: 12, borderRadius: 6, borderWidth: 2.5 },
  nowDot: { marginTop: 3, width: 10, height: 10, borderRadius: 5 },
  nowLine: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 14 },
  cardCol: { flex: 1, minWidth: 0 },
  card: { borderRadius: 20, padding: 13, paddingHorizontal: 14 },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardText: { flex: 1, minWidth: 0 },
  eyebrow: { position: 'absolute', top: 9, left: 14, fontSize: 10.5, letterSpacing: 1.4 },
  must: { position: 'absolute', top: 9, right: 12, fontSize: 9.5, letterSpacing: 1.2 },
  go: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  grip: { width: 30, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: -6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 22, paddingHorizontal: 9, borderRadius: 99 },
  iconBox: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bar: { height: 5, borderRadius: 5, marginTop: 10, overflow: 'hidden' },
  later: { borderRadius: 20, padding: 14, gap: 8, marginTop: 6, marginBottom: 16 },
  laterRow: { flexDirection: 'row', gap: 10 },
  doneItem: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 9, paddingRight: 14, marginBottom: 8 },
  thumb: { width: 40, height: 40, borderRadius: 11 },
});
