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

export function App() {
  return (
    <>
      {/* Background/Mid-layer Interactive Flying Logo */}
      <FloatingLogo />

      {/* Main App Layout */}
      <div className="site-wrapper">
        <Navbar />

        <main id="main-content">
          <Hero />
          <About />
          <Services />
          <Work />
          <Studies />
          <InternetService />
          <Blog />
          <Contact />
        </main>

        <Footer />
      </div>
    </>
  );
}

export default App;
