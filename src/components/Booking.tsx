import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { Phone } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { services, type ServiceId } from '../content/services';
import { site } from '../content/site';
import { submitBooking, type BookingRequest } from '../lib/booking';
import { isOpenOn, maxBookingDate, minBookingDate, parseDate, timeSlotsFor } from '../lib/schedule';
import { InstagramIcon } from './InstagramIcon';
import { NailMark } from './NailMark';
import './Booking.css';

type Field = 'name' | 'contact' | 'service' | 'date' | 'time' | 'message' | 'consent';
type Values = Record<Exclude<Field, 'consent'>, string> & { consent: boolean };
type Errors = Partial<Record<Field, string>>;
type Status = 'idle' | 'sending' | 'sent' | 'not-connected' | 'error';

const empty: Values = { name: '', contact: '', service: '', date: '', time: '', message: '', consent: false };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s\-()/]{7,20}$/;

const chipColors: Record<string, string> = {
  gel: 'var(--lavender)',
  extensions: 'var(--butter)',
  builder: 'var(--sage)',
  classic: 'var(--powder)',
  art: 'var(--butter)',
  special: 'var(--lavender)',
  unsure: 'var(--paper)',
};

interface BookingProps {
  preselect: { id: ServiceId; nonce: number } | null;
  /** A nail-studio design summary; it is written into the message field for the visitor to review. */
  designNote?: { text: string; nonce: number } | null;
}

export function Booking({ preselect, designNote = null }: BookingProps) {
  const { t, lang } = useI18n();
  const f = t.booking.form;
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;

  const [values, setValues] = useState<Values>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [lastRequest, setLastRequest] = useState<BookingRequest | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const [minDate] = useState(minBookingDate);
  const [maxDate] = useState(maxBookingDate);
  const slots = useMemo(() => timeSlotsFor(values.date), [values.date]);
  const pickedDate = parseDate(values.date);
  const closedDay = Boolean(pickedDate && !isOpenOn(pickedDate));

  // Selections made elsewhere on the page ("Book this", "Book with this design")
  // are applied while rendering when the request changes, per React docs.
  const [seenPreselect, setSeenPreselect] = useState<number | null>(null);
  if (preselect && preselect.nonce !== seenPreselect) {
    setSeenPreselect(preselect.nonce);
    setStatus('idle');
    setValues((v) => ({ ...v, service: preselect.id }));
    setErrors((e) => ({ ...e, service: undefined }));
  }
  const [seenDesign, setSeenDesign] = useState<number | null>(null);
  const [lastDesignText, setLastDesignText] = useState<string | null>(null);
  if (designNote && designNote.nonce !== seenDesign) {
    setSeenDesign(designNote.nonce);
    setStatus('idle');
    setLastDesignText(designNote.text);
    setValues((v) => {
      // Replace an earlier studio note instead of stacking copies; keep anything the visitor wrote.
      const own = lastDesignText ? v.message.replace(lastDesignText, '').trim() : v.message.trim();
      // A designed set is custom nail art, unless the visitor already chose a service.
      return { ...v, service: v.service || 'special', message: own ? `${own}\n\n${designNote.text}` : designNote.text };
    });
    setErrors((e) => ({ ...e, service: undefined }));
  }

  // Show the visitor where their design went: bring the message field into view and focus it.
  const messageRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (seenDesign === null) return;
    const el = messageRef.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = setTimeout(() => {
      el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
      el.focus({ preventScroll: true });
    }, 60);
    return () => clearTimeout(id);
  }, [seenDesign]);

  useEffect(() => {
    if (status !== 'idle' && status !== 'sending') statusRef.current?.focus();
  }, [status]);

  const validate = (v: Values): Errors => {
    const e: Errors = {};
    const er = t.booking.errors;
    if (!v.name.trim()) e.name = er.name;
    const c = v.contact.trim();
    if (!c) e.contact = er.contactRequired;
    else if (!EMAIL.test(c) && !(PHONE.test(c) && c.replace(/\D/g, '').length >= 7)) e.contact = er.contactInvalid;
    if (!v.service) e.service = er.service;
    if (!v.date) e.date = er.date;
    else {
      const d = parseDate(v.date);
      if (!d || v.date < minDate) e.date = er.dateTooEarly;
      else if (!isOpenOn(d)) e.date = er.dateClosed;
    }
    if (!e.date && !v.time) e.time = er.time;
    if (!v.consent) e.consent = er.consent;
    return e;
  };

  // Re-validate as the visitor types, but only after the first submit attempt.
  const update = <K extends Field>(key: K, value: Values[K]) => {
    const next = { ...values, [key]: value };
    if (key === 'date' && !timeSlotsFor(String(value)).includes(values.time)) next.time = '';
    setValues(next);
    if (submitted) setErrors(validate(next));
    else if (key === 'date') {
      const d = parseDate(String(value));
      setErrors((e) => ({ ...e, date: d && !isOpenOn(d) ? t.booking.errors.dateClosed : undefined }));
    }
  };

  const serviceLabel = (sid: string) => (sid === 'unsure' ? f.serviceUnsure : (t.services.items[sid]?.name ?? sid));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const found = validate(values);
    setErrors(found);
    const firstInvalid = (Object.keys(found) as Field[])[0];
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    const request: BookingRequest = {
      name: values.name.trim(),
      contact: values.contact.trim(),
      service: values.service,
      serviceLabel: serviceLabel(values.service),
      date: values.date,
      time: values.time,
      message: values.message.trim(),
      lang,
    };
    setLastRequest(request);
    setStatus('sending');
    const result = await submitBooking(request);
    setStatus(result.status);
    if (result.status === 'sent') {
      setValues(empty);
      setSubmitted(false);
    }
  };

  const mailtoHref = (r: BookingRequest) => {
    const date = parseDate(r.date);
    const dateText = date
      ? new Intl.DateTimeFormat(lang === 'hu' ? 'hu-HU' : 'en-GB', { dateStyle: 'full' }).format(date)
      : r.date;
    const lines = [
      t.booking.mail.greeting,
      '',
      `${f.name}: ${r.name}`,
      `${f.contact}: ${r.contact}`,
      `${f.service} ${r.serviceLabel}`,
      `${f.date} ${dateText}`,
      `${f.time} ${r.time}`,
      r.message ? `\n${f.message}:\n${r.message}` : '',
    ].filter((line, i) => line !== '' || i === 1);
    return `mailto:${site.email}?subject=${encodeURIComponent(t.booking.mail.subject(r.name))}&body=${encodeURIComponent(lines.join('\n'))}`;
  };

  const describedBy = (field: Field, hint?: boolean) =>
    [hint && id(`${field}-hint`), errors[field] && id(`${field}-error`)].filter(Boolean).join(' ') || undefined;

  const errorText = (field: Field) =>
    errors[field] ? (
      <p className="field__error" id={id(`${field}-error`)}>
        {errors[field]}
      </p>
    ) : null;

  const errorCount = Object.values(errors).filter(Boolean).length;
  const serviceOptions = [...services.map((s) => s.id as string), 'unsure'];

  return (
    <section className="booking" id="booking" aria-labelledby="booking-title">
      <div className="container booking__grid">
        <div className="booking__aside">
          <h2 className="section-title booking__title" id="booking-title" data-reveal>
            {t.booking.heading}
          </h2>
          <p className="booking__intro" data-reveal style={{ '--reveal-delay': '120ms' } as React.CSSProperties}>
            {t.booking.intro}
          </p>

          <h3 className="visually-hidden">{t.booking.stepsLabel}</h3>
          <ol className="booking__steps">
            {t.booking.steps.map((step, i) => (
              <li key={i} data-reveal style={{ '--reveal-delay': `${180 + i * 80}ms` } as React.CSSProperties}>
                <span className="booking__step-num" aria-hidden="true">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <div className="booking__alt">
            <p className="booking__alt-title">{t.booking.alternative}</p>
            <p className="booking__alt-links">
              <a className="ink-link" href={site.phoneHref} style={{ '--hl': 'var(--butter)' } as React.CSSProperties}>
                <Phone size={16} strokeWidth={2} aria-hidden="true" />
                {t.booking.alternativeCall}: {site.phone}
              </a>
              <a className="ink-link" href={site.instagram.url} target="_blank" rel="noopener noreferrer" style={{ '--hl': 'var(--paper)' } as React.CSSProperties}>
                <InstagramIcon size={16} />
                {t.booking.alternativeDm}
              </a>
            </p>
          </div>
        </div>

        <div className="booking__card">
          {status === 'sent' || status === 'not-connected' ? (
            <div className="booking__status" ref={statusRef} tabIndex={-1} role="status">
              <NailMark size={54} color={status === 'sent' ? 'var(--sage)' : 'var(--butter)'} className="booking__status-mark" />
              {status === 'sent' ? (
                <>
                  <h3 className="booking__status-title">{t.booking.sent.title}</h3>
                  <p>{t.booking.sent.text}</p>
                  <div className="booking__status-actions">
                    <button type="button" className="btn" onClick={() => setStatus('idle')}>
                      {t.booking.sent.again}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="booking__status-title">{t.booking.notConnected.title}</h3>
                  <p>{t.booking.notConnected.text}</p>
                  <div className="booking__status-actions">
                    {lastRequest && (
                      <a className="btn" href={mailtoHref(lastRequest)}>
                        {t.booking.notConnected.email}
                      </a>
                    )}
                    <a className="btn btn--butter" href={site.phoneHref}>
                      {t.booking.notConnected.call}
                    </a>
                  </div>
                  <button type="button" className="booking__back ink-link" onClick={() => setStatus('idle')}>
                    {t.booking.notConnected.back}
                  </button>
                </>
              )}
            </div>
          ) : (
            <form ref={formRef} className="booking__form" onSubmit={onSubmit} noValidate aria-label={f.label}>
              <div className="booking__summary" aria-live="polite" role="status">
                {submitted && errorCount > 0 ? t.booking.errors.summary : ''}
              </div>
              {status === 'error' && (
                <p className="booking__failed" role="alert" ref={statusRef} tabIndex={-1}>
                  {t.booking.failed}
                </p>
              )}

              {/* Service chips */}
              <fieldset className="field field--full" aria-describedby={describedBy('service')}>
                <legend>{f.service}</legend>
                <div className="chips">
                  {serviceOptions.map((sid) => (
                    <label key={sid} className="pick" style={{ '--pick': chipColors[sid] } as React.CSSProperties}>
                      <input
                        type="radio"
                        name="service"
                        value={sid}
                        checked={values.service === sid}
                        onChange={() => update('service', sid)}
                        aria-invalid={Boolean(errors.service)}
                      />
                      <span>{serviceLabel(sid)}</span>
                    </label>
                  ))}
                </div>
                {errorText('service')}
              </fieldset>

              <div className="field">
                <label htmlFor={id('date')}>{f.date}</label>
                <input
                  id={id('date')}
                  name="date"
                  type="date"
                  min={minDate}
                  max={maxDate}
                  value={values.date}
                  onChange={(e) => update('date', e.target.value)}
                  aria-invalid={Boolean(errors.date)}
                  aria-describedby={describedBy('date', true)}
                  required
                />
                <p className="field__hint" id={id('date-hint')}>
                  {f.openDays}
                </p>
                {errorText('date')}
              </div>

              {/* Time chips: appear once a day is chosen */}
              <fieldset className="field field--time" aria-describedby={describedBy('time')}>
                <legend>{f.time}</legend>
                {slots.length ? (
                  <div className="chips chips--time">
                    {slots.map((slot) => (
                      <label key={slot} className="pick pick--time">
                        <input
                          type="radio"
                          name="time"
                          value={slot}
                          checked={values.time === slot}
                          onChange={() => update('time', slot)}
                          aria-invalid={Boolean(errors.time)}
                        />
                        <span>{slot}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="field__empty">{closedDay ? f.timeClosed : f.timeNeedsDate}</p>
                )}
                {errorText('time')}
              </fieldset>

              <div className="field">
                <label htmlFor={id('name')}>{f.name}</label>
                <input
                  id={id('name')}
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={values.name}
                  onChange={(e) => update('name', e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={describedBy('name')}
                  required
                />
                {errorText('name')}
              </div>

              <div className="field">
                <label htmlFor={id('contact')}>{f.contact}</label>
                <input
                  id={id('contact')}
                  name="contact"
                  type="text"
                  autoComplete="email"
                  value={values.contact}
                  onChange={(e) => update('contact', e.target.value)}
                  aria-invalid={Boolean(errors.contact)}
                  aria-describedby={describedBy('contact', true)}
                  required
                />
                <p className="field__hint" id={id('contact-hint')}>
                  {f.contactHint}
                </p>
                {errorText('contact')}
              </div>

              <div className="field field--full">
                <label htmlFor={id('message')}>
                  {f.message} <span className="field__optional">({f.optional})</span>
                </label>
                <textarea
                  ref={messageRef}
                  id={id('message')}
                  name="message"
                  rows={lastDesignText && values.message.includes(lastDesignText) ? 7 : 3}
                  value={values.message}
                  onChange={(e) => update('message', e.target.value)}
                  aria-describedby={id('message-hint')}
                />
                <p className="field__hint" id={id('message-hint')}>
                  {lastDesignText && values.message.includes(lastDesignText) ? t.studio.noteAdded : f.messageHint}
                </p>
              </div>

              <div className="field field--full field--check">
                <input
                  id={id('consent')}
                  name="consent"
                  type="checkbox"
                  checked={values.consent}
                  onChange={(e) => update('consent', e.target.checked)}
                  aria-invalid={Boolean(errors.consent)}
                  aria-describedby={describedBy('consent')}
                  required
                />
                <label htmlFor={id('consent')}>{f.consent}</label>
                {errorText('consent')}
              </div>

              <div className="field--full booking__submit">
                <button type="submit" className="btn" disabled={status === 'sending'}>
                  {status === 'sending' ? f.sending : f.submit}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
