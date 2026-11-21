import type { Tag } from '@/lib/data';

/** Stand-in artwork for sample proofs. Real proofs show the photo instead. */
export function Art({ tag, i }: { tag: Tag; i: number }) {
  const v = i % 3;
  if (tag === 'study') {
    const bg = [['#D5E6F6', '#B7D0EA'], ['#DCE8F8', '#BDD0EE'], ['#CFE3EE', '#AFCCE0']][v];
    const sq = ['M86 90c12-12 18 8 32-2s20 8 34-2 20 6 36-2 22 4 40-4', 'M86 114c14-8 20 8 34-2s24 6 40-2 18 8 38-2', 'M86 138c10-10 22 6 36-2s18 8 34-2 24 4 44-4', 'M86 186c14-6 22 8 38-2s20 6 36-2'];
    return (
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Sample notebook">
        <defs>
          <linearGradient id={`s${i}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={bg[0]} />
            <stop offset="1" stopColor={bg[1]} />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill={`url(#s${i})`} />
        <g transform={`rotate(${v - 1} 200 150)`}>
          <rect x="54" y="38" width="292" height="226" rx="14" fill="#FFFDF7" />
          {Array.from({ length: 7 }, (_, k) => (
            <path key={k} d={`M78 ${96 + k * 24}h244`} stroke="#C3D0E0" strokeWidth="2" />
          ))}
          {sq.slice(0, 3 + (v % 2)).map((d) => (
            <path key={d} d={d} fill="none" stroke="#3B6AA0" strokeWidth="3" strokeLinecap="round" />
          ))}
          <rect x="78" y="58" width="96" height="10" rx="5" fill="#E58A8A" />
        </g>
        <g transform="rotate(32 330 230)">
          <rect x="300" y="214" width="84" height="12" rx="6" fill="#F1C36B" />
          <path d="M384 214l14 6-14 6z" fill="#E7A55A" />
        </g>
      </svg>
    );
  }
  if (tag === 'fit') {
    const g = [['#FBD8C2', '#F2A98A'], ['#FFE3CC', '#F0B190'], ['#F9D2C4', '#E99B84']][v];
    return (
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Sample workout">
        <defs>
          <linearGradient id={`f${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={g[0]} />
            <stop offset="1" stopColor={g[1]} />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill={`url(#f${i})`} />
        <circle cx={90 + v * 90} cy="120" r="46" fill="#FFF1D6" opacity=".9" />
        <rect y="226" width="400" height="74" fill="#C9755A" opacity=".35" />
        <g transform={`translate(0 ${v * 4})`}>
          <rect x="108" y="196" width="184" height="12" rx="6" fill="#4A4558" />
          <rect x="92" y="170" width="22" height="64" rx="8" fill="#3B3748" />
          <rect x="72" y="182" width="18" height="40" rx="7" fill="#57526A" />
          <rect x="286" y="170" width="22" height="64" rx="8" fill="#3B3748" />
          <rect x="310" y="182" width="18" height="40" rx="7" fill="#57526A" />
        </g>
      </svg>
    );
  }
  const cs = [['#9CC9B6', '#F2B8A8', '#F3D68B', '#A9C8F0'], ['#B7D8E8', '#E9B4C6', '#C9E0A8', '#F3D68B'], ['#F3D68B', '#9CC9B6', '#C4B3E6', '#F2B8A8']][v];
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Sample tidy room">
      <defs>
        <linearGradient id={`l${i}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#DDF0E6" />
          <stop offset="1" stopColor="#B9DCCB" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#l${i})`} />
      <rect y="236" width="400" height="64" fill="#8DBBA4" opacity=".45" />
      {cs.map((c, k) => (
        <g key={k}>
          <rect x={110 - k * 3 + (k % 2) * 8} y={196 - k * 38} width={190 - (k % 2) * 10} height="36" rx="10" fill={c} />
          <path d={`M${126 - k * 3} ${208 - k * 38}h150`} stroke="#fff" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}
