import { site } from '../../config/site';
import { usePrefs } from '../../context/Preferences';
import { focusAreas, technologies } from '../../data/content';
import { SectionHeader } from '../ui/SectionHeader';
import { Reveal } from '../ui/Reveal';
import { GraduationCap, BookOpen, Layers, CheckCircle } from 'lucide-react';

export function Studies() {
  const { t, tr } = usePrefs();

  return (
    <section id="studies" className="section-padding studies-section" data-float-scale="0.95">
      <div className="container">
        <SectionHeader
          index="04"
          eyebrow={t.studies.eyebrow}
          title={t.studies.title}
          lead={t.studies.lead}
          id="studies-title"
        />

        {/* Academic Card */}
        <Reveal className="academic-highlight-card">
          <div className="academic-card-glow" aria-hidden="true" />
          <div className="academic-card-pattern" aria-hidden="true" />
          <div className="academic-badge-watermark" aria-hidden="true">
            <GraduationCap size={170} />
          </div>

          <div className="academic-icon-bg">
            <GraduationCap size={44} className="text-electric academic-cap-icon" />
          </div>
          <div className="academic-details">
            <div className="academic-tag">
              <BookOpen size={14} />
              <span>{t.studies.status}</span>
            </div>
            <h3 className="academic-major">{tr(site.study.major)}</h3>
            <p className="academic-note">{tr(site.study.university)}</p>
          </div>
        </Reveal>

        {/* Focus Pillars */}
        <div className="focus-pillars-grid">
          {focusAreas.map((area, idx) => {
            const Icon = area.icon;
            return (
              <Reveal key={idx} delay={idx * 0.1} className="pillar-card">
                <div className="pillar-header">
                  <div className="pillar-icon-box">
                    <Icon size={24} className="text-electric" />
                  </div>
                  <h4 className="pillar-title">{tr(area.title)}</h4>
                </div>
                <p className="pillar-text">{tr(area.text)}</p>
                <div className="pillar-topics">
                  {area.topics.map((tp, i) => (
                    <span key={i} className="topic-pill">
                      <span className="dot-mini" />
                      {tr(tp)}
                    </span>
                  ))}
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Technologies Breakdown - Honest Strip without fake percentages */}
        <div className="tech-strip-container">
          <Reveal className="tech-strip-box">
            <h4 className="tech-strip-title">
              <Layers size={17} className="text-electric" />
              <span>{t.studies.builtWith}</span>
            </h4>
            <div className="tech-pills-row">
              {technologies.builtWith.map((tech, i) => (
                <span key={i} className="tech-badge built" dir="ltr">
                  {tech}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.15} className="tech-strip-box">
            <h4 className="tech-strip-title">
              <BookOpen size={17} className="text-cyan" />
              <span>{t.studies.learning}</span>
            </h4>
            <div className="tech-pills-row">
              {technologies.learning.map((tech, i) => (
                <span key={i} className="tech-badge learning" dir="ltr">
                  {tech}
                </span>
              ))}
            </div>
          </Reveal>

          {technologies.skills.length > 0 && (
            <Reveal delay={0.25} className="tech-strip-box">
              <h4 className="tech-strip-title">
                <CheckCircle size={17} className="text-electric" />
                <span>{t.studies.skills}</span>
              </h4>
              <div className="tech-pills-row">
                {technologies.skills.map((tech, i) => (
                  <span key={i} className="tech-badge skill" dir="ltr">
                    {tech}
                  </span>
                ))}
              </div>
            </Reveal>
          )}

          <p className="tech-note-footnote">{t.studies.stripNote}</p>
        </div>
      </div>
    </section>
  );
}
