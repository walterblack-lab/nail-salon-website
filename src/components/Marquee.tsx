import { NailMark } from './NailMark';
import './Marquee.css';

const markColors = ['var(--butter)', 'var(--lavender)', 'var(--sage)', 'var(--powder)'];

/** Decorative scrolling ribbon of services. Content is repeated for a seamless loop. */
export function Marquee({ items }: { items: string[] }) {
  const run = (copy: number) =>
    items.map((item, i) => (
      <span className="marquee__item" key={`${copy}-${i}`}>
        {item}
        <NailMark size={22} color={markColors[i % markColors.length]} />
      </span>
    ));

  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">
        <div className="marquee__group">{run(0)}</div>
        <div className="marquee__group">{run(1)}</div>
      </div>
    </div>
  );
}
