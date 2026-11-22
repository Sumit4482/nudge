'use client';

import { useEffect, useRef } from 'react';
import { BEE_TASK, BEES_DISTURB, type BeeRequest, type BeeTask } from '@/lib/bees';

const TOTAL = 8;
const ALARM_MS = 3200;
const GO_TIMEOUT = 16000;
const LEAVE_MS = 1300;

type Mode = 'wander' | 'go' | 'work' | 'leave';

interface Bee {
  node: HTMLElement;
  x: number;
  y: number;
  h: number;
  speed: number;
  ph: number;
  s: number;
  dir: number;
  mode: Mode;
  task: BeeTask | null;
  since: number;
  until: number;
  alarm: number;
  jt: number;
}

/**
 * Small bees wander calmly over the whole page, not just the screen: they live in the page, so scrolling moves past them.
 * They turn gently, now and then hover, stay inside the page, and shy away from the pointer.
 * The honeycomb can call one over to work on a cell, and tapping the jar sends every bee into a panic.
 * Off for visitors who ask for reduced motion.
 */
export function Swarm() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = box.current;
    if (!host || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const nodes = Array.from(host.children) as HTMLElement[];
    const small = window.innerWidth < 700;
    const count = small ? 5 : TOTAL;
    nodes.forEach((n, i) => (n.style.display = i < count ? 'block' : 'none'));
    const root = document.documentElement;
    let W = root.clientWidth;
    let H = Math.max(root.scrollHeight, window.innerHeight);
    host.style.height = `${H}px`;
    const bees: Bee[] = nodes.slice(0, count).map((node, i) => ({
      node,
      x: Math.random() * W,
      y: ((i + Math.random()) / count) * H,
      h: Math.random() * Math.PI * 2,
      speed: (small ? 30 : 38) + Math.random() * 26,
      ph: Math.random() * 100,
      s: 0.8 + Math.random() * 0.5,
      dir: 1,
      mode: 'wander',
      task: null,
      since: 0,
      until: 0,
      alarm: 0,
      jt: 0,
    }));

    const pointer = { x: -999, y: -999 };
    const move = (e: PointerEvent) => {
      pointer.x = e.pageX;
      pointer.y = e.pageY;
    };
    window.addEventListener('pointermove', move, { passive: true });
    // The page can grow or shrink (filters, photos, a resized window), so the flying area follows it.
    const ro = new ResizeObserver(() => {
      W = root.clientWidth;
      H = Math.max(root.scrollHeight, window.innerHeight);
      host.style.height = `${H}px`;
    });
    ro.observe(document.body);

    const turn = (from: number, to: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from));
    const calm = (b: Bee) => {
      b.mode = 'wander';
      b.task = null;
      b.node.classList.remove('working');
    };

    // The honeycomb asks for a bee: one of the three nearest, picked at random, answers.
    const onTask = (e: Event) => {
      const req = (e as CustomEvent<BeeRequest>).detail;
      if (req.accepted) return;
      const now = performance.now();
      const free = bees.filter((b) => b.mode === 'wander' && b.alarm < now);
      if (!free.length) return;
      const T = req.task.target();
      free.sort((a, b) => Math.hypot(a.x - T.x, a.y - T.y) - Math.hypot(b.x - T.x, b.y - T.y));
      const bee = free[Math.floor(Math.random() * Math.min(3, free.length))];
      bee.mode = 'go';
      bee.task = req.task;
      bee.since = now;
      req.accepted = true;
    };
    window.addEventListener(BEE_TASK, onTask);

    // Someone tapped the jar: every bee panics, and a bee in the middle of work drops it.
    const onDisturb = () => {
      const now = performance.now();
      for (const b of bees) {
        if (b.task) b.task.onAbort();
        calm(b);
        b.alarm = now + ALARM_MS;
        b.h += (Math.random() - 0.5) * 3;
        b.jt = 0;
      }
    };
    window.addEventListener(BEES_DISTURB, onDisturb);

    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      for (const b of bees) {
        const a = Math.max(0, b.alarm - now) / ALARM_MS; // 1 right after the disturbance, fading to 0
        let vx = 0;
        let vy = 0;
        let tilt = 0;
        let scale = b.s;

        if (b.mode === 'work' && b.task) {
          const T = b.task.target();
          const k = Math.min(1, 7 * dt);
          const nx = b.x + (T.x - b.x) * k;
          const ny = b.y + (T.y - b.y) * k + Math.sin(t * 24 + b.ph) * 0.9;
          vx = (nx - b.x) / Math.max(dt, 0.001);
          b.x = nx;
          b.y = ny;
          scale = b.s * 0.92;
          if (now >= b.until) {
            b.task.onDone();
            b.task = null;
            b.mode = 'leave';
            b.since = now;
            b.h = -Math.PI / 2 + (Math.random() - 0.5) * 1.5; // lift off, upward
            b.node.classList.remove('working');
          }
        } else {
          if (b.mode === 'go' && b.task) {
            const T = b.task.target();
            const dx = T.x - b.x;
            const dy = T.y - b.y;
            const dist = Math.hypot(dx, dy);
            if (now - b.since > GO_TIMEOUT) {
              b.task.onAbort();
              calm(b);
            } else if (dist < 9) {
              b.mode = 'work';
              b.until = now + b.task.work;
              b.node.classList.add('working');
              b.task.onArrive();
            } else {
              // fly a gently curving line, slowing down as it gets close
              b.h += turn(b.h, Math.atan2(dy, dx)) * Math.min(1, 6 * dt);
              b.h += Math.sin(t * 2.4 + b.ph) * 0.5 * Math.min(1, dist / 260) * dt;
              const sp = Math.min(230, 34 + dist * 2.2);
              const near = dist < 70 ? Math.min(1, 3.5 * dt) : 0;
              vx = Math.cos(b.h) * sp;
              vy = Math.sin(b.h) * sp;
              b.x += vx * dt + dx * near;
              b.y += vy * dt + dy * near;
            }
          } else {
            // wandering, or just leaving the honeycomb
            const leaving = b.mode === 'leave';
            if (leaving && now - b.since > LEAVE_MS) b.mode = 'wander';
            b.h += (Math.sin(t * 0.7 + b.ph) + Math.sin(t * 1.3 + b.ph * 1.9)) * 1.3 * (1 + 3 * a) * dt;
            if (a > 0) {
              b.jt -= dt;
              if (b.jt <= 0) {
                b.jt = 0.1 + Math.random() * 0.18;
                b.h += (Math.random() - 0.5) * 3.4 * a;
              }
            }
            const hover = !leaving && a === 0 && Math.sin(t * 0.35 + b.ph * 3) > 0.94;
            let sp = hover ? b.speed * 0.15 : b.speed;
            if (leaving) sp *= 1 + 1.6 * (1 - (now - b.since) / LEAVE_MS);
            sp *= 1 + 3.2 * a;
            const m = 40;
            if (b.x < m || b.x > W - m || b.y < m || b.y > H - m) b.h += turn(b.h, Math.atan2(Math.min(Math.max(b.y, 160), H - 160) - b.y, W / 2 - b.x)) * 2.4 * dt;
            const px = b.x - pointer.x;
            const py = b.y - pointer.y;
            if (Math.hypot(px, py) < 110) b.h += turn(b.h, Math.atan2(py, px)) * 5 * dt;
            vx = Math.cos(b.h) * sp;
            vy = Math.sin(b.h) * sp + Math.sin(t * 9 + b.ph) * 7;
            b.x += vx * dt;
            b.y += vy * dt;
          }
        }

        b.node.classList.toggle('panic', a > 0.05);
        if (Math.abs(vx) > 3) b.dir = vx < 0 ? -1 : 1;
        if (b.mode !== 'work') tilt = Math.max(-30, Math.min(30, (Math.atan2(vy, Math.abs(vx) + 0.001) * 180) / Math.PI));
        b.node.style.transform = `translate3d(${b.x}px,${b.y}px,0) scale(${b.dir * scale},${scale}) rotate(${tilt}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', move);
      window.removeEventListener(BEE_TASK, onTask);
      window.removeEventListener(BEES_DISTURB, onDisturb);
    };
  }, []);

  return (
    <div className="swarm" ref={box} aria-hidden="true">
      {Array.from({ length: TOTAL }, (_, i) => (
        <i key={i} className="swb">
          <svg viewBox="-13 -13 26 22" width="26" height="22">
            <ellipse className="w" cx="-3" cy="-7" rx="6" ry="4" fill="#EAF4FB" opacity=".95" />
            <ellipse className="w" cx="5" cy="-8" rx="6" ry="4" fill="#EAF4FB" opacity=".95" />
            <ellipse cx="1" cy="0" rx="10" ry="7" fill="#FBD76B" />
            <path d="M-2 -6 V6 M3 -6.5 V6.5" stroke="#6B5A3E" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="9" cy="-1" r="1.4" fill="#6B5A3E" />
          </svg>
        </i>
      ))}
    </div>
  );
}
