import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const images = [
  'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1584982751601-97dcc096659c?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1576765607924-b44c1d3b7497?q=80&w=1600&auto=format&fit=crop'
];

export default function Home() {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const next = () => setIdx(i => (i + 1) % images.length);
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);

  useEffect(() => {
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [idx]);

  return (
    <div>
      <div className="header3d">
        <h1 className="logo"><span>Jeevak</span></h1>
        <div className="subtitle">Your simple healthcare access portal</div>
      </div>

      <div className="carousel">
        {images.map((src, i) => (
          <img key={i} src={src} alt="Hospital" className={i===idx ? 'active' : ''} />
        ))}
        <button className="arrow left" onClick={prev} aria-label="Previous">◀</button>
        <button className="arrow right" onClick={next} aria-label="Next">▶</button>
      </div>

      <div className="home-actions">
        <Link href="/login"><button className="button">Login</button></Link>
        <Link href="/register"><button className="button secondary">Register</button></Link>
      </div>

      <div className="home-card" style={{marginTop: 24}}>
        <h3>About Jeevak</h3>
        <p className="small">
          Jeevak is a hospital management system
        </p>
      </div>

      <footer className="footer">© {new Date().getFullYear()} Jeevak — Simplifying patient & staff access</footer>
    </div>
  );
  
}
