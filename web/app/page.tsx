import { CheerButton } from '@/components/CheerButton';
import { Clouds } from '@/components/Clouds';
import { Garden } from '@/components/Garden';
import { Heatmap } from '@/components/Heatmap';
import { HeroCopy } from '@/components/HeroCopy';
import { ProofWall, type WallProof } from '@/components/ProofWall';
import { Reveal } from '@/components/Reveal';
import { ScrollLink } from '@/components/ScrollLink';
import { Swarm } from '@/components/Swarm';
import { getSiteData, imageUrl } from '@/lib/data';
import { ago } from '@/lib/format';
import { gardenCaption } from '@/lib/garden';
import { SITE } from '@/lib/site';

/** Refresh the data about once a minute. */
export const revalidate = 60;

const REPO = 'https://github.com/Sumit4482/nudge';

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
  const { streak, level, xp, week_count } = data.stats;
  const today = new Date().toISOString().slice(0, 10);
  const doneToday = data.daily.find((d) => d.day === today)?.n ?? 0;
  const updated = new Date(data.proofs[0]?.created_at ?? now).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <Clouds />
      <Swarm />
      <Reveal />
      <noscript>
        <style>{'[data-reveal],.hc{opacity:1!important;transform:none!important}'}</style>
      </noscript>

      <nav className="pill" aria-label="Sections">
        <ScrollLink to="wall">Photos</ScrollLink>
        <ScrollLink to="cheer">Cheer</ScrollLink>
      </nav>

      <main>
        <section className="hero wrap" id="top">
          <div className="hero-copy">
            <HeroCopy />
            <div className="cta">
              <ScrollLink to="wall" className="btn">
                See the photos
              </ScrollLink>
              <ScrollLink to="cheer" className="btn ghost">
                Send a cheer
              </ScrollLink>
            </div>
            {data.sample ? <p className="sample-note">Preview with made-up examples.</p> : null}
          </div>
        </section>

        <section className="wrap nums" data-reveal>
          <dl className="stats">
            <div className="s1">
              <dt>Streak</dt>
              <dd>
                {streak} <small>day{streak === 1 ? '' : 's'}</small>
              </dd>
            </div>
            <div className="s2">
              <dt>Level</dt>
              <dd>
                {level} <small>{xp.toLocaleString()} XP</small>
              </dd>
            </div>
            <div className="s3">
              <dt>Proofs this week</dt>
              <dd>{week_count}</dd>
            </div>
            <div className="s4">
              <dt>Done today</dt>
              <dd>{doneToday}</dd>
            </div>
          </dl>
        </section>

        <section className="sec wrap" id="cheer">
          <div className="cheer-card" data-reveal>
            <CheerButton total={data.cheers} name={SITE.name} />
          </div>
        </section>

        <section className="sec wrap" data-reveal>
          <div className="pair">
            <article className="tile">
              <h3>The garden</h3>
              <div className="garden">
                <Garden streak={streak} />
              </div>
              <p className="note">{gardenCaption(streak)}. The jar fills as you go.</p>
            </article>
            <article className="tile">
              <h3>Last 12 weeks</h3>
              <Heatmap daily={data.daily} />
            </article>
          </div>
        </section>

        <section className="sec wrap" id="wall">
          <h2 data-reveal>The proof wall</h2>
          <ProofWall proofs={proofs} />
        </section>

      </main>

      <footer>
        <div className="wrap">
          <span>
            Built with Nudge ·{' '}
            <a href={REPO} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>{' '}
            · Proofs are shared one by one, on purpose · Updated {updated}
          </span>
        </div>
      </footer>
    </>
  );
}
