import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useReducer, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Copy, Download, Layers, RotateCcw, Undo2, X } from 'lucide-react';
import { useI18n } from '../../i18n/LanguageContext';
import type { Dictionary } from '../../i18n/hu';
import { site } from '../../content/site';
import {
  ARTS,
  canAddGem,
  DEFAULT_MANICURE,
  DETAIL_COLOURS,
  detailIdOf,
  FINGERS,
  FINISHES,
  GEM_SPOTS,
  GEMS,
  initialState,
  polishIdOf,
  POLISHES,
  reducer,
  SHAPES,
  type Gem,
  type GemSpot,
  type StudioState,
  type Manicure,
  type NailDesign,
  type Patch,
  type Target,
} from './model';
import { Hand, NailPreview } from './Hand';
import { SKIN_TONES, type SkinTone } from './skin';
import { GemShape, StudioDefs } from './Nail';
import { exportHandPng } from './exportPng';
import './NailStudio.css';

const TABS = ['colour', 'finish', 'shape', 'art', 'gems'] as const;
type Tab = (typeof TABS)[number];

type T = Dictionary['studio'];

/** Arrow keys move through a radio group, as native radios do. */
function rovingKeys(e: KeyboardEvent<HTMLElement>, count: number, current: number, select: (i: number) => void) {
  const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
  const jump = e.key === 'Home' ? 0 : e.key === 'End' ? count - 1 : null;
  if (!dir && jump === null) return;
  e.preventDefault();
  const next = jump ?? (Math.max(current, 0) + dir + count) % count;
  select(next);
  const items = e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"], [role="tab"]');
  items[next]?.focus();
}

const colourName = (hex: string, t: T) => {
  const id = polishIdOf(hex) ?? detailIdOf(hex);
  return id ? t.colours[id] : hex.toUpperCase();
};

function describeNail(n: NailDesign, t: T) {
  const parts = [colourName(n.colour, t), t.finishes[n.finish].toLowerCase(), t.shapes[n.shape].toLowerCase()];
  if (n.art !== 'none') parts.push(`${t.arts[n.art].toLowerCase()} (${colourName(n.artColour, t).toLowerCase()})`);
  if (n.gems.length) parts.push(n.gems.map((g) => t.gems[g.kind].toLowerCase()).join(', '));
  return parts.join(', ');
}

const unique = <V,>(list: V[]) => [...new Set(list)];

const DRAFT_KEY = 'mira-nail-studio-draft';

/** Read a saved draft, trusting only what passes a shape check. */
function restoreDraft(base: StudioState): StudioState {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return base;
    const nails = JSON.parse(raw) as unknown;
    const hex = /^#[0-9a-f]{6}$/i;
    const valid =
      Array.isArray(nails) &&
      nails.length === 5 &&
      nails.every(
        (n) =>
          n &&
          hex.test(n.colour) &&
          hex.test(n.artColour) &&
          (FINISHES as readonly string[]).includes(n.finish) &&
          (SHAPES as readonly string[]).includes(n.shape) &&
          (ARTS as readonly string[]).includes(n.art) &&
          Array.isArray(n.gems) &&
          n.gems.length <= 6 &&
          n.gems.every(
            (g: Gem) => Number.isInteger(g.id) && (GEMS as readonly string[]).includes(g.kind) && (GEM_SPOTS as readonly string[]).includes(g.spot),
          ),
      );
    if (!valid) return base;
    const maxId = Math.max(base.nextGemId, ...(nails as Manicure).flatMap((n) => n.gems.map((g) => g.id + 1)));
    return { ...base, nails: nails as Manicure, nextGemId: maxId };
  } catch {
    return base;
  }
}

export function NailStudio({ onBookDesign }: { onBookDesign: (note: string) => void }) {
  const { t: dict } = useI18n();
  const t = dict.studio;
  const [state, dispatch] = useReducer(reducer, initialState, restoreDraft);
  // Keep a draft in this browser, so a refresh or an app switch doesn't lose the set.
  useEffect(() => {
    try {
      if (state.nails === DEFAULT_MANICURE) localStorage.removeItem(DRAFT_KEY);
      else localStorage.setItem(DRAFT_KEY, JSON.stringify(state.nails));
    } catch {
      /* storage unavailable: the studio still works, it just won't remember */
    }
  }, [state.nails]);
  const { nails } = state;
  const [target, setTarget] = useState<Target>(3);
  const [tab, setTab] = useState<Tab>('colour');
  const [skin, setSkin] = useState<SkinTone>(SKIN_TONES[0]);
  const [pasteFrom, setPasteFrom] = useState<number | null>(null);
  const [spot, setSpot] = useState<GemSpot>('cuticle');
  const [notice, setNotice] = useState<{ text: string; key: number } | null>(null);
  const [saving, setSaving] = useState(false);
  // Without motion (or without IntersectionObserver) the polish is simply there.
  const [painted, setPainted] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window),
  );
  const svgRef = useRef<SVGSVGElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  const say = useCallback((text: string) => setNotice({ text, key: Date.now() }), []);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 5200);
    return () => clearTimeout(id);
  }, [notice]);

  // The one authored moment: the polish is brushed on, cuticle to tip, the first time the studio is seen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || painted) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPainted(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [painted]);

  // Copy mode ends with Escape wherever focus is (tapping the hand leaves focus on the page).
  useEffect(() => {
    if (pasteFrom === null) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && setPasteFrom(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pasteFrom]);

  const fingerName = (i: number) => t.fingers[FINGERS[i]];
  const targetName = target === 'all' ? t.allNailsLong : fingerName(target);

  /** The design shown in the controls: the selected nail, or the thumb's when editing all five. */
  const shown = nails[target === 'all' ? 0 : target];
  const valueOf = <K extends keyof Patch>(key: K): NailDesign[K] | null => {
    if (target !== 'all') return nails[target][key];
    return nails.every((n) => n[key] === nails[0][key]) ? nails[0][key] : null;
  };

  const patch = (p: Patch, coalesce?: string) => {
    if (pasteFrom !== null) setPasteFrom(null);
    dispatch({ type: 'patch', target, patch: p, coalesce });
  };

  const select = (next: Target) => {
    setTarget(next);
    say(t.notices.selected(next === 'all' ? t.allNailsLong : fingerName(next)));
  };

  const onNailClick = useCallback(
    (i: number) => {
      if (pasteFrom !== null) {
        if (i === pasteFrom) return;
        dispatch({ type: 'copy', from: pasteFrom, to: i });
        say(t.notices.copied(t.fingers[FINGERS[i]]));
        return;
      }
      setTarget(i);
      say(t.notices.selected(t.fingers[FINGERS[i]]));
    },
    [pasteFrom, say, t],
  );

  const undo = () => {
    if (!state.past.length) return;
    dispatch({ type: 'undo' });
    say(t.notices.undone);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
      if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
      e.preventDefault();
      undo();
    }
  };

  const save = async () => {
    if (!svgRef.current || saving) return;
    setSaving(true);
    try {
      await exportHandPng(svgRef.current, t.fileName, t.signature, `Instagram ${site.instagram.handle}`);
      say(t.notices.saved);
    } catch {
      say(t.notices.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const bookNote = useMemo(
    () => t.bookNote(nails.map((n, i) => `${t.fingers[FINGERS[i]]}: ${describeNail(n, t)}`).join('\n')),
    [nails, t],
  );


  return (
    <section
      ref={sectionRef}
      className={`studio${painted ? ' is-painted' : ''}${pasteFrom !== null ? ' is-pasting' : ''}`}
      id="studio"
      aria-labelledby="studio-title"
      onKeyDown={onKeyDown}
    >
      <div className="container studio__inner">
        <header className="studio__intro">
          <h2 className="section-title studio__title" id="studio-title">
            {t.heading}
          </h2>
          <p className="studio__text">{t.text}</p>
        </header>

        <div className="studio__stage">
          <div className="studio__arch">
            <Hand nails={nails} target={target} skin={skin} pasteFrom={pasteFrom} onNailClick={onNailClick} label={t.handLabel} svgRef={svgRef} />

            {pasteFrom !== null ? (
              <div className="studio__paste" role="status">
                <p>{t.copyPrompt(fingerName(pasteFrom))}</p>
                <button type="button" className="studio__chip studio__chip--light" onClick={() => setPasteFrom(null)}>
                  {t.actions.copyDone}
                </button>
              </div>
            ) : (
              <SkinPicker skin={skin} setSkin={setSkin} t={t} />
            )}
          </div>

          <NailStrip nails={nails} target={target} skin={skin} pasteFrom={pasteFrom} onPick={onNailClick} onSelect={select} t={t} />
        </div>

        <div className="studio__controls">
          <p className="studio__editing">
            <span>{t.editing}:</span> <strong>{targetName}</strong>
          </p>

          <Tabs tab={tab} setTab={setTab} uid={uid} t={t} />

          <div className="studio__panel" role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${tab}`} key={tab}>
            {tab === 'colour' && <ColourPanel value={valueOf('colour')} onPick={(hex, c) => patch({ colour: hex }, c)} t={t} />}
            {tab === 'finish' && (
              <TilePanel
                label={t.tabs.finish}
                options={FINISHES}
                value={valueOf('finish')}
                names={t.finishes}
                preview={(f) => ({ ...shown, finish: f, gems: [] })}
                skin={skin}
                onPick={(f) => patch({ finish: f })}
              />
            )}
            {tab === 'shape' && (
              <TilePanel
                label={t.tabs.shape}
                options={SHAPES}
                value={valueOf('shape')}
                names={t.shapes}
                preview={(s) => ({ ...shown, shape: s, gems: [] })}
                skin={skin}
                onPick={(s) => patch({ shape: s })}
              />
            )}
            {tab === 'art' && (
              <>
                <TilePanel
                  label={t.tabs.art}
                  options={ARTS}
                  value={valueOf('art')}
                  names={t.arts}
                  preview={(a) => ({ ...shown, art: a, gems: [] })}
                  skin={skin}
                  onPick={(a) => patch({ art: a })}
                  dense
                />
                <DetailColours value={valueOf('artColour')} onPick={(hex) => patch({ artColour: hex })} t={t} />
              </>
            )}
            {tab === 'gems' && (
              <GemsPanel
                nails={nails}
                target={target}
                spot={spot}
                setSpot={setSpot}
                onAdd={(kind) => {
                  if (pasteFrom !== null) setPasteFrom(null);
                  const hit = target === 'all' ? nails : [nails[target]];
                  if (!hit.some((n) => canAddGem(n, spot))) return say(t.gemsFull);
                  dispatch({ type: 'addGem', target, kind, spot });
                }}
                onRemove={(nail, id) => dispatch({ type: 'removeGem', nail, id })}
                onClear={() => dispatch({ type: 'clearGems', target })}
                t={t}
              />
            )}
          </div>

          <div className="studio__actions">
            <button type="button" className="studio__tool" onClick={undo} disabled={!state.past.length}>
              <Undo2 aria-hidden="true" />
              {t.actions.undo}
            </button>
            <button
              type="button"
              className="studio__tool"
              aria-pressed={pasteFrom !== null}
              disabled={target === 'all'}
              onClick={() => setPasteFrom((v) => (v === null && target !== 'all' ? target : null))}
            >
              <Copy aria-hidden="true" />
              {t.actions.copy}
            </button>
            <button
              type="button"
              className="studio__tool"
              disabled={target === 'all'}
              onClick={() => {
                if (target === 'all') return;
                dispatch({ type: 'applyAll', from: target });
                say(t.notices.applied(fingerName(target)));
              }}
            >
              <Layers aria-hidden="true" />
              {t.actions.applyAll}
            </button>
            <button
              type="button"
              className="studio__tool"
              onClick={() => {
                setPasteFrom(null);
                dispatch({ type: 'reset' });
                say(t.notices.reset);
              }}
            >
              <RotateCcw aria-hidden="true" />
              {t.actions.reset}
            </button>
          </div>

          <p className="studio__notice" aria-live="polite" role="status">
            {notice && <span key={notice.key}>{notice.text}</span>}
          </p>

          <Summary nails={nails} t={t} />

          <div className="studio__finish">
            <a className="btn btn--butter studio__book" href="#booking" onClick={() => onBookDesign(bookNote)}>
              {t.bookCta}
            </a>
            <button type="button" className="studio__tool studio__save" onClick={save} disabled={saving}>
              <Download aria-hidden="true" />
              {saving ? t.actions.saving : t.actions.save}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   Pieces
------------------------------------------------------------------- */

function SkinPicker({ skin, setSkin, t }: { skin: SkinTone; setSkin: (s: SkinTone) => void; t: T }) {
  const current = SKIN_TONES.findIndex((s) => s.id === skin.id);
  return (
    <div
      className="studio__skin"
      role="radiogroup"
      aria-label={t.skinLabel}
      onKeyDown={(e) => rovingKeys(e, SKIN_TONES.length, current, (i) => setSkin(SKIN_TONES[i]))}
    >
      {SKIN_TONES.map((s) => (
        <button
          key={s.id}
          type="button"
          role="radio"
          aria-checked={s.id === skin.id}
          tabIndex={s.id === skin.id ? 0 : -1}
          aria-label={`${t.skinLabel}: ${t.skins[s.id]}`}
          title={t.skins[s.id]}
          className="studio__skin-dot"
          style={{ '--tone': s.mid } as CSSProperties}
          onClick={() => setSkin(s)}
        />
      ))}
    </div>
  );
}

function NailStrip({
  nails,
  target,
  skin,
  pasteFrom,
  onPick,
  onSelect,
  t,
}: {
  nails: Manicure;
  target: Target;
  skin: SkinTone;
  pasteFrom: number | null;
  onPick: (i: number) => void;
  onSelect: (target: Target) => void;
  t: T;
}) {
  const options: Target[] = [0, 1, 2, 3, 4, 'all'];
  const current = options.indexOf(target);
  const pasting = pasteFrom !== null;

  if (pasting) {
    return (
      <div className="studio__strip" role="group" aria-label={t.copyPrompt(t.fingers[FINGERS[pasteFrom]])}>
        {nails.map((n, i) => (
          <button
            key={i}
            type="button"
            className="studio__strip-nail"
            data-source={i === pasteFrom || undefined}
            disabled={i === pasteFrom}
            aria-label={`${t.actions.copy}: ${t.fingers[FINGERS[i]]}`}
            onClick={() => onPick(i)}
          >
            <NailPreview design={n} skin={skin} seed={i + 3} />
          </button>
        ))}
        <span className="studio__strip-all" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      className="studio__strip"
      role="radiogroup"
      aria-label={t.nailPicker}
      onKeyDown={(e) => rovingKeys(e, options.length, current, (i) => onSelect(options[i]))}
    >
      {nails.map((n, i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={target === i}
          tabIndex={target === i ? 0 : -1}
          aria-label={t.fingers[FINGERS[i]]}
          title={t.fingers[FINGERS[i]]}
          className="studio__strip-nail"
          onClick={() => onSelect(i)}
        >
          <NailPreview design={n} skin={skin} seed={i + 3} />
        </button>
      ))}
      <button
        type="button"
        role="radio"
        aria-checked={target === 'all'}
        tabIndex={target === 'all' ? 0 : -1}
        aria-label={t.allNailsLong}
        className="studio__strip-all"
        onClick={() => onSelect('all')}
      >
        {t.allNails}
      </button>
    </div>
  );
}

function Tabs({ tab, setTab, uid, t }: { tab: Tab; setTab: (t: Tab) => void; uid: string; t: T }) {
  const list = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const current = TABS.indexOf(tab);

  // The indicator travels by transform only: a 1px bar moved and stretched to the active tab.
  useLayoutEffect(() => {
    const place = () => {
      const el = list.current?.querySelector<HTMLElement>(`[aria-selected="true"]`);
      if (!el || !bar.current) return;
      const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0;
      bar.current.style.transform = `translateX(${el.offsetLeft + pad}px) scaleX(${el.offsetWidth - pad * 2})`;
    };
    place();
    const ro = new ResizeObserver(place);
    if (list.current) ro.observe(list.current);
    return () => ro.disconnect();
  }, [tab, t]);

  return (
    <div
      ref={list}
      className="studio__tabs"
      role="tablist"
      aria-label={t.tabsLabel}
      onKeyDown={(e) => rovingKeys(e, TABS.length, current, (i) => setTab(TABS[i]))}
    >
      {TABS.map((id) => (
        <button
          key={id}
          type="button"
          role="tab"
          id={`${uid}-tab-${id}`}
          aria-selected={tab === id}
          aria-controls={`${uid}-panel`}
          tabIndex={tab === id ? 0 : -1}
          className="studio__tab"
          onClick={() => setTab(id)}
        >
          {t.tabs[id]}
        </button>
      ))}
      <span ref={bar} className="studio__tab-bar" aria-hidden="true" />
    </div>
  );
}

function ColourPanel({ value, onPick, t }: { value: string | null; onPick: (hex: string, coalesce?: string) => void; t: T }) {
  const current = value ? POLISHES.findIndex((p) => p.hex === value) : -1;
  const isCustom = value !== null && current === -1;
  return (
    <div className="studio__colours">
      <div
        className="studio__swatches"
        role="radiogroup"
        aria-label={t.tabs.colour}
        onKeyDown={(e) => rovingKeys(e, POLISHES.length, current, (i) => onPick(POLISHES[i].hex))}
      >
        {POLISHES.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={i === current}
            tabIndex={i === current || (current === -1 && i === 0) ? 0 : -1}
            aria-label={t.colours[p.id]}
            title={t.colours[p.id]}
            className="studio__swatch"
            style={{ '--swatch': p.hex } as CSSProperties}
            onClick={() => onPick(p.hex)}
          />
        ))}
        <label className="studio__swatch studio__swatch--custom" data-active={isCustom || undefined} title={t.customPick} style={isCustom ? ({ '--swatch': value } as CSSProperties) : undefined}>
          <span className="visually-hidden">{t.customPick}</span>
          <input type="color" value={value ?? '#c9b7e9'} onChange={(e) => onPick(e.target.value, 'custom-colour')} />
        </label>
      </div>
      <p className="studio__current">
        {value ? (isCustom ? `${t.custom}: ${value.toUpperCase()}` : t.colours[POLISHES[current].id]) : '—'}
      </p>
    </div>
  );
}

function TilePanel<O extends string>({
  label,
  options,
  value,
  names,
  preview,
  skin,
  onPick,
  dense = false,
}: {
  label: string;
  options: readonly O[];
  value: O | null;
  names: Record<string, string>;
  preview: (o: O) => NailDesign;
  skin: SkinTone;
  onPick: (o: O) => void;
  dense?: boolean;
}) {
  const current = value ? options.indexOf(value) : -1;
  return (
    <div
      className={`studio__tiles${dense ? ' studio__tiles--dense' : ''}`}
      role="radiogroup"
      aria-label={label}
      onKeyDown={(e) => rovingKeys(e, options.length, current, (i) => onPick(options[i]))}
    >
      {options.map((o, i) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={i === current}
          tabIndex={i === current || (current === -1 && i === 0) ? 0 : -1}
          className="studio__tile"
          onClick={() => onPick(o)}
        >
          <NailPreview design={preview(o)} skin={skin} showGems={false} seed={i + 11} />
          <span>{names[o]}</span>
        </button>
      ))}
    </div>
  );
}

function DetailColours({ value, onPick, t }: { value: string | null; onPick: (hex: string) => void; t: T }) {
  const current = value ? DETAIL_COLOURS.findIndex((d) => d.hex === value) : -1;
  return (
    <div className="studio__detail">
      <p className="studio__sub" id="studio-detail-label">
        {t.detailColour}
      </p>
      <div
        className="studio__swatches studio__swatches--small"
        role="radiogroup"
        aria-labelledby="studio-detail-label"
        onKeyDown={(e) => rovingKeys(e, DETAIL_COLOURS.length, current, (i) => onPick(DETAIL_COLOURS[i].hex))}
      >
        {DETAIL_COLOURS.map((d, i) => (
          <button
            key={d.id}
            type="button"
            role="radio"
            aria-checked={i === current}
            tabIndex={i === current || (current === -1 && i === 0) ? 0 : -1}
            aria-label={t.colours[d.id]}
            title={t.colours[d.id]}
            className={`studio__swatch${d.id === 'gold' || d.id === 'silver' ? ' studio__swatch--metal' : ''}`}
            style={{ '--swatch': d.hex } as CSSProperties}
            onClick={() => onPick(d.hex)}
          />
        ))}
      </div>
    </div>
  );
}

function GemsPanel({
  nails,
  target,
  spot,
  setSpot,
  onAdd,
  onRemove,
  onClear,
  t,
}: {
  nails: Manicure;
  target: Target;
  spot: GemSpot;
  setSpot: (s: GemSpot) => void;
  onAdd: (kind: (typeof GEMS)[number]) => void;
  onRemove: (nail: number, id: number) => void;
  onClear: () => void;
  t: T;
}) {
  const g = 'nsg' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const hit = target === 'all' ? nails.map((n, i) => ({ n, i })) : [{ n: nails[target], i: target }];
  const full = !hit.some(({ n }) => canAddGem(n, spot));
  const list = hit.flatMap(({ n, i }) => n.gems.map((gem) => ({ gem, nail: i })));
  const currentSpot = GEM_SPOTS.indexOf(spot);

  return (
    <div className="studio__gems">
      <svg width="0" height="0" className="studio__defs" aria-hidden="true" focusable="false">
        <defs>
          <StudioDefs g={g} />
        </defs>
      </svg>

      <p className="studio__sub" id="studio-spot-label">
        {t.spotLabel}
      </p>
      <div
        className="studio__segments"
        role="radiogroup"
        aria-labelledby="studio-spot-label"
        onKeyDown={(e) => rovingKeys(e, GEM_SPOTS.length, currentSpot, (i) => setSpot(GEM_SPOTS[i]))}
      >
        {GEM_SPOTS.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={spot === s}
            tabIndex={spot === s ? 0 : -1}
            className="studio__segment"
            onClick={() => setSpot(s)}
          >
            {t.spots[s]}
          </button>
        ))}
      </div>

      <div className="studio__tiles studio__tiles--gems" aria-describedby="studio-gems-hint">
        {GEMS.map((kind) => (
          <button
            key={kind}
            type="button"
            className="studio__tile studio__tile--gem"
            aria-disabled={full || undefined}
            aria-label={t.addGem(t.gems[kind], t.spots[spot])}
            onClick={() => onAdd(kind)}
          >
            <svg viewBox="-20 -20 40 40" aria-hidden="true" focusable="false">
              <GemShape kind={kind} r={kind === 'crystal' ? 9 : kind === 'glitter' ? 13 : 11} g={g} index={2} />
            </svg>
            <span>{t.gems[kind]}</span>
          </button>
        ))}
      </div>
      <p className="studio__hint" id="studio-gems-hint">
        {full ? t.gemsFull : t.gemsHint}
      </p>

      <div className="studio__onnail">
        <div className="studio__onnail-head">
          <p className="studio__sub">{target === 'all' ? t.onAll : t.onNail}</p>
          {list.length > 1 && (
            <button type="button" className="studio__text-btn" onClick={onClear}>
              {t.clearGems}
            </button>
          )}
        </div>
        {list.length ? (
          <ul className="studio__gem-list">
            {list.map(({ gem, nail }) => (
              <li key={`${nail}-${gem.id}`}>
                <button
                  type="button"
                  className="studio__chip"
                  onClick={() => onRemove(nail, gem.id)}
                  aria-label={`${t.removeGem(t.gems[gem.kind])}${target === 'all' ? `, ${t.fingers[FINGERS[nail]].toLowerCase()}` : ''}`}
                >
                  {t.gems[gem.kind]}
                  {target === 'all' && <small>{t.fingers[FINGERS[nail]]}</small>}
                  <X aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="studio__hint">{t.noGems}</p>
        )}
      </div>
    </div>
  );
}

function Summary({ nails, t }: { nails: Manicure; t: T }) {
  const s = t.summary;
  const shapes = unique(nails.map((n) => t.shapes[n.shape]));
  const finishes = unique(nails.map((n) => t.finishes[n.finish]));
  const colours = unique(nails.map((n) => n.colour.toLowerCase()));
  const arts = unique(nails.filter((n) => n.art !== 'none').map((n) => t.arts[n.art]));
  const gemCounts = new Map<string, number>();
  nails.forEach((n) => n.gems.forEach((g) => gemCounts.set(g.kind, (gemCounts.get(g.kind) ?? 0) + 1)));

  return (
    <section className="studio__summary" aria-labelledby="studio-summary-title">
      <h3 id="studio-summary-title">{s.heading}</h3>
      <dl>
        <div>
          <dt>{s.colours}</dt>
          <dd className="studio__summary-colours">
            {colours.map((c) => (
              <span key={c}>
                <i style={{ '--swatch': c } as CSSProperties} aria-hidden="true" />
                {colourName(c, t)}
              </span>
            ))}
          </dd>
        </div>
        <div>
          <dt>{s.shape}</dt>
          <dd>{shapes.join(', ')}</dd>
        </div>
        <div>
          <dt>{s.finish}</dt>
          <dd>{finishes.join(', ')}</dd>
        </div>
        <div>
          <dt>{s.art}</dt>
          <dd>{arts.length ? arts.join(', ') : s.none}</dd>
        </div>
        <div>
          <dt>{s.gems}</dt>
          <dd>
            {gemCounts.size
              ? [...gemCounts].map(([kind, count]) => `${t.gems[kind]}${count > 1 ? ` ×${count}` : ''}`).join(', ')
              : s.none}
          </dd>
        </div>
      </dl>
    </section>
  );
}
