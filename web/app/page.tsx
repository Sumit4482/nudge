import { CheerButton } from '@/components/CheerButton';
import { Garden, gardenCaption } from '@/components/Garden';
import { Heatmap } from '@/components/Heatmap';
import { ProofWall, type WallProof } from '@/components/ProofWall';
import { SkyController } from '@/components/SkyController';
import { getSiteData, imageUrl } from '@/lib/data';
import { ago } from '@/lib/format';
import { SITE } from '@/lib/site';

/** Refresh the data about once a minute. */
export const revalidate = 60;

const HOW = [
  ['Photo first', 'A task only counts once a photo is uploaded in the app. The wall shows exactly that photo.'],
  ['Shared one by one', 'Every proof starts private. A switch in the app posts it here. Bills and voice notes can never be posted.'],
  ['30 minute delay', `Proofs appear about half an hour after they happen, so this page never shows where ${SITE.name} is right now.`],
  ['Location removed', 'Photos are re-saved before upload, which strips GPS and camera details.'],
  ['Delete any time', 'Remove a proof in the app and it leaves this page within a minute.'],
] as const;

export default async function Home() {
  const data = await getSiteData();
  const now = Date.now();
  const proofs: WallProof[] = data.proofs.map((p) => ({
    id: p.id,
    title: p.task_title,
    tag: p.tag,
    caption: p.caption ?? '',
    minutes: p.minutes,
    xp: p.xp,
    when: ago(p.created_at, now),
    src: p.image_path ? imageUrl(p.image_path) : '',
  }));
  const latest = data.proofs[0];
  const { streak, level, xp, week_count } = data.stats;
  const today = new Date().toISOString().slice(0, 10);
  const doneToday = data.daily.find((d) => d.day === today)?.n ?? 0;

  return (
    <>
      <SkyController />
      <div className="page">
        <header className="top">
          <div className="brand">
            <span className="logo" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            </span>
            Nudge wall
          </div>
          {data.sample ? <span className="tag-draft">Sample proofs</span> : null}
        </header>

        <section className="hero">
          <span className="live">
            <i />
            <span>{latest ? `Last proof ${ago(latest.created_at, now)}: ${latest.task_title}` : 'No proofs yet. Check back soon.'}</span>
          </span>
          <h1>
            {SITE.name} is really <em>working.</em>
          </h1>
          <p className="lede">Every tick on this page has a photo behind it. No photo, no tick. Receipts included.</p>
          <div className="stats">
            <div className="stat"><b>{streak}<small>days</small></b><span>Current streak</span></div>
            <div className="stat"><b>{level}<small>{xp.toLocaleString()} XP</small></b><span>Level</span></div>
            <div className="stat"><b>{week_count}</b><span>Proofs this week</span></div>
            <div className="stat"><b>{doneToday}<small>today</small></b><span>Done today</span></div>
          </div>
          <CheerButton total={data.cheers} name={SITE.name} />
          {data.sample ? <p className="sample-note">This is a preview with made-up examples. It shows real proofs once Supabase is connected.</p> : null}
        </section>

        <section className="two">
          <article className="card garden">
            <h3>The garden</h3>
            <Garden streak={streak} level={level} />
            <p className="cap">{gardenCaption(streak)}</p>
          </article>
          <article className="card">
            <h3>Last 12 weeks</h3>
            <Heatmap daily={data.daily} />
          </article>
        </section>

        <section className="feed" id="wall-sec">
          <ProofWall proofs={proofs} />
        </section>

        <section className="feed">
          <h2 style={{ font: '600 28px/1.1 var(--f-display)', letterSpacing: '-.025em' }}>How a proof gets here</h2>
          <div className="how">
            {HOW.map(([t, d]) => (
              <div key={t}>
                <b>{t}</b>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </section>

        <footer>
          <span>Built with Nudge. Proofs are shared one by one, on purpose, about 30 minutes after they happen.</span>
          <span>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </footer>
      </div>
    </>
  );
}
