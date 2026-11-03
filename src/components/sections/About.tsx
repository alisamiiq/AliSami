import { site } from '../../config/site';
import { usePrefs } from '../../context/Preferences';
import { aboutText, interests } from '../../data/content';
import { SectionHeader } from '../ui/SectionHeader';
import { Reveal } from '../ui/Reveal';
import { Terminal, Sparkles } from 'lucide-react';

export function About() {
  const { t, tr } = usePrefs();

  return (
    <section id="about" className="section-padding about-section" data-float-scale="0.95">
      <div className="container">
        <SectionHeader
          index="01"
          eyebrow={t.about.eyebrow}
          title={t.about.title}
          lead={t.about.lead}
          id="about-title"
        />

        <div className="about-grid">
          {/* Narrative text & Code Profile Card */}
          <div className="about-story-col">
            <div className="about-paragraphs">
              {aboutText.map((p, i) => (
                <Reveal key={i} delay={i * 0.1}>
                  <p className="story-paragraph">{tr(p)}</p>
                </Reveal>
              ))}
            </div>

            {/* Developer Profile Terminal Card */}
            <Reveal delay={0.3} className="profile-terminal-card">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <div className="terminal-title">
                  <Terminal size={14} />
                  <span>{t.about.terminalTitle}</span>
                </div>
              </div>
              <div className="terminal-body" dir="ltr">
                <p className="code-line"><span className="code-kw">const</span> developer = &#123;</p>
                <p className="code-line indent">
                  <span className="code-prop">{t.about.termName}:</span> <span className="code-str">"{site.name.en} ({site.name.ar})"</span>,
                </p>
                <p className="code-line indent">
                  <span className="code-prop">{t.about.termStudy}:</span> <span className="code-str">"{tr(site.study.major)}"</span>,
                </p>
                <p className="code-line indent">
                  <span className="code-prop">{t.about.termWork}:</span> <span className="code-str">"{t.about.termWorkValue}"</span>,
                </p>
                <p className="code-line indent">
                  <span className="code-prop">{t.about.termLocation}:</span> <span className="code-str">"{tr(site.locationShort)}"</span>,
                </p>
                <p className="code-line indent">
                  <span className="code-prop">{t.about.termFocus}:</span> [<span className="code-str">"AI"</span>, <span className="code-str">"Web"</span>, <span className="code-str">"Networks"</span>]
                </p>
                <p className="code-line">&#125;;</p>
              </div>
            </Reveal>
          </div>

          {/* Core Areas of Interest Cards */}
          <div className="about-interests-col">
            <h3 className="interests-headline">
              <Sparkles size={18} className="text-electric" />
              <span>{t.about.interestsTitle}</span>
            </h3>

            <div className="interests-grid">
              {interests.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Reveal
                    key={index}
                    delay={0.15 + index * 0.1}
                    className="interest-card"
                  >
                    <div className="interest-icon-box">
                      <Icon size={24} className="text-electric" />
                    </div>
                    <div className="interest-info">
                      <h4 className="interest-title">{tr(item.title)}</h4>
                      <p className="interest-text">{tr(item.text)}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
