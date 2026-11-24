import { useState } from 'react';
import { useI18n } from './i18n/LanguageContext';
import { useReveal } from './lib/useReveal';
import type { ServiceId } from './content/services';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Services } from './components/Services';
import { Gallery } from './components/Gallery';
import { ShadeBand } from './components/ShadeBand';
import { NailStudio } from './components/studio/NailStudio';
import { Booking } from './components/Booking';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

export default function App() {
  const { t } = useI18n();
  const [preselect, setPreselect] = useState<{ id: ServiceId; nonce: number } | null>(null);
  const [shadeRequest, setShadeRequest] = useState<{ name: string; nonce: number } | null>(null);
  const [designNote, setDesignNote] = useState<{ text: string; nonce: number } | null>(null);
  useReveal();

  return (
    <>
      <a className="skip-link" href="#main">
        {t.skipLink}
      </a>
      <Header />
      <main id="main">
        <Hero />
        <About />
        <Services onBook={(id) => setPreselect({ id, nonce: Date.now() })} />
        <Gallery />
        <ShadeBand onBookShade={(name) => setShadeRequest({ name, nonce: Date.now() })} />
        <NailStudio onBookDesign={(text) => setDesignNote({ text, nonce: Date.now() })} />
        <Booking preselect={preselect} shadeRequest={shadeRequest} designNote={designNote} />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
