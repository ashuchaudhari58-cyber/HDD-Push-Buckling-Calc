/* Simple line illustrations for the workflow cards (orange = active / engineering data, grey = secondary). */

const A = 'var(--brand)';
const S = 'var(--text-muted)';
const common = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };

const GLYPHS = {
  // project sheet with revision block
  project: (
    <>
      <rect x="54" y="10" width="52" height="62" rx="4" stroke={S} strokeWidth="2" {...common} />
      <path d="M62 24h28M62 32h36M62 40h22" stroke={S} strokeWidth="2" {...common} />
      <rect x="62" y="50" width="36" height="14" rx="2" stroke={A} strokeWidth="2" {...common} />
      <path d="M74 50v14M86 50v14" stroke={A} strokeWidth="1.5" {...common} />
      <circle cx="112" cy="18" r="9" stroke={A} strokeWidth="2" {...common} />
      <path d="M108 18l3 3 5-6" stroke={A} strokeWidth="2" {...common} />
    </>
  ),
  // input sliders
  inputs: (
    <>
      {[22, 40, 58].map((y, i) => (
        <g key={y}>
          <path d={`M40 ${y}h80`} stroke={S} strokeWidth="2" {...common} />
          <path d={`M40 ${y}h${[52, 28, 66][i]}`} stroke={A} strokeWidth="3" {...common} />
          <circle cx={40 + [52, 28, 66][i]} cy={y} r="6" fill="var(--surface)" stroke={A} strokeWidth="2.5" />
        </g>
      ))}
    </>
  ),
  // HDD bore profile under ground
  profile: (
    <>
      <path d="M14 22h132" stroke={S} strokeWidth="2" {...common} />
      <path d="M30 22 L48 44 Q56 56 70 56 H92 Q106 56 114 44 L130 22" stroke={A} strokeWidth="3" {...common} />
      <circle cx="30" cy="22" r="3.5" fill={A} />
      <circle cx="130" cy="22" r="3.5" fill={A} />
      <path d="M81 26v26" stroke={S} strokeWidth="1.5" strokeDasharray="3 3" {...common} />
      <path d="M78 49l3 4 3-4" stroke={S} strokeWidth="1.5" {...common} />
    </>
  ),
  // numbered calculation steps with formula lines
  steps: (
    <>
      {[18, 38, 58].map((y, i) => (
        <g key={y}>
          <rect x="36" y={y - 7} width="14" height="14" rx="3" stroke={i === 2 ? A : S} strokeWidth="2" {...common} />
          <path d={`M58 ${y}h${[46, 58, 38][i]}`} stroke={i === 2 ? A : S} strokeWidth="2" {...common} />
          <path d={`M${110 + [0, 12, -8][i]} ${y}h10`} stroke={A} strokeWidth="2" {...common} />
        </g>
      ))}
      <path d="M41 58l2.5 2.5 4-5" stroke={A} strokeWidth="2" {...common} />
    </>
  ),
  // force vs chainage chart with limit line
  results: (
    <>
      <path d="M34 12v56h96" stroke={S} strokeWidth="2" {...common} />
      <path d="M34 26h96" stroke="var(--warn)" strokeWidth="1.5" strokeDasharray="5 4" {...common} />
      <path d="M34 66 L52 60 L66 56 L96 46 L106 34 L126 30" stroke={A} strokeWidth="3" {...common} />
      {[[52, 60], [66, 56], [96, 46], [106, 34], [126, 30]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3" fill="var(--surface)" stroke={A} strokeWidth="2" />)}
    </>
  ),
  // straight vs buckled pipe
  structural: (
    <>
      <path d="M24 24h112" stroke={S} strokeWidth="6" {...common} />
      <path d="M24 54 C36 44, 44 64, 56 54 S76 44, 88 54 S108 64, 120 54 L136 54" stroke={A} strokeWidth="6" {...common} />
      <path d="M146 24h-6M146 54h-6" stroke={S} strokeWidth="2" {...common} />
      <path d="M142 20l4 4-4 4M142 50l4 4-4 4" stroke={A} strokeWidth="2" {...common} />
    </>
  ),
  // clamp gripping a pipe, push direction
  clamp: (
    <>
      <path d="M16 40h94" stroke={S} strokeWidth="12" {...common} />
      <rect x="48" y="22" width="36" height="10" rx="2" stroke={A} strokeWidth="2.5" {...common} />
      <rect x="48" y="48" width="36" height="10" rx="2" stroke={A} strokeWidth="2.5" {...common} />
      <path d="M58 14v8M74 14v8M58 58v8M74 58v8" stroke={A} strokeWidth="2.5" {...common} />
      <path d="M120 40h26M139 33l7 7-7 7" stroke={A} strokeWidth="2.5" {...common} />
    </>
  ),
  // report document with chart
  report: (
    <>
      <path d="M58 10h34l14 14v48H58z" stroke={S} strokeWidth="2" {...common} />
      <path d="M92 10v14h14" stroke={S} strokeWidth="2" {...common} />
      <path d="M66 32h24M66 40h32" stroke={S} strokeWidth="2" {...common} />
      <path d="M66 62l8-8 7 5 11-12" stroke={A} strokeWidth="2.5" {...common} />
      <path d="M112 50v16M106 60l6 6 6-6" stroke={A} strokeWidth="2.5" {...common} />
    </>
  ),
};

export function WorkflowGlyph({ name }) {
  return (
    <svg viewBox="0 0 160 80" width="100%" height="100%" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      {GLYPHS[name]}
    </svg>
  );
}
