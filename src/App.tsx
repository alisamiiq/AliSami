import { Navbar } from './components/layout/Navbar';
import { Hero } from './components/sections/Hero';
import { About } from './components/sections/About';
import { Services } from './components/sections/Services';
import { Work } from './components/sections/Work';
import { Studies } from './components/sections/Studies';
import { InternetService } from './components/sections/InternetService';
import { Blog } from './components/sections/Blog';
import { Contact } from './components/sections/Contact';
import { Footer } from './components/layout/Footer';
import { FloatingLogo } from './features/floating-logo/FloatingLogo';
import { SiteConfigProvider, useSiteConfig } from './context/SiteConfig';

function MainSections() {
  const { isSectionVisible } = useSiteConfig();

  return (
    <main id="main-content">
      <Hero />
      {isSectionVisible('about') && <About />}
      {isSectionVisible('services') && <Services />}
      {isSectionVisible('work') && <Work />}
      {isSectionVisible('studies') && <Studies />}
      {isSectionVisible('internet') && <InternetService />}
      <Blog />
      {isSectionVisible('contact') && <Contact />}
    </main>
  );
}

export function App() {
  return (
    <SiteConfigProvider>
      {/* Background/Mid-layer Interactive Flying Logo */}
      <FloatingLogo />

      {/* Main App Layout */}
      <div className="site-wrapper">
        <Navbar />
        <MainSections />
        <Footer />
      </div>
    </SiteConfigProvider>
  );
}

export default App;
