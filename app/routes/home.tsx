import { Link } from 'react-router';

export function meta() {
  return [
    { title: '1cec0ld.net' },
    { name: 'description', content: "Jeremy Luchak's website" },
  ];
}

const SECTIONS = [
  { to: '/mcdb', title: 'Minecraft DB', blurb: 'Browse the PokemonServer plugin’s lab runs, prices, towns and hordes.', spa: true },
  { to: '/downloads/', title: 'Downloads', blurb: 'Files to download.', spa: false },
  { to: '/dance/', title: 'Dance', blurb: 'The dance archive.', spa: false },
];

export default function Home() {
  return (
    <main className="page home">
      <h1>1cec0ld.net</h1>
      <p className="lede">Jeremy Luchak’s website.</p>
      <ul className="cards">
        {SECTIONS.map(s => (
          <li key={s.to}>
            {/* /downloads and /dance are served by Express, not React Router: use a full page load. */}
            {s.spa ? <Link to={s.to}><b>{s.title}</b><span>{s.blurb}</span></Link>
                   : <a href={s.to}><b>{s.title}</b><span>{s.blurb}</span></a>}
          </li>
        ))}
      </ul>
    </main>
  );
}
