import { usePrefs } from '../../context/Preferences';
import { services } from '../../data/content';
import { SectionHeader } from '../ui/SectionHeader';
import { Reveal } from '../ui/Reveal';
import { requestContactTopic } from '../../lib/contactTopic';
import { ArrowUpRight } from 'lucide-react';

export function Services() {
  const { t, tr } = usePrefs();

  const handleRequestService = (serviceTitle: string) => {
    requestContactTopic(serviceTitle);
  };

  return (
    <section id="services" className="section-padding services-section" data-float-scale="1.0">
      <div className="container">
        <SectionHeader
          index="02"
          eyebrow={t.services.eyebrow}
          title={t.services.title}
          lead={t.services.lead}
          id="services-title"
        />

        <div className="services-grid">
          {services.map((service, index) => {
            const Icon = service.icon;
            const title = tr(service.title);
            return (
              <Reveal
                key={service.id}
                delay={index * 0.08}
                className="service-card"
              >
                <div className="service-card-glow" aria-hidden="true" />
                <div className="service-card-pattern" aria-hidden="true" />
                <div className="service-watermark" aria-hidden="true">
                  <Icon size={140} />
                </div>

                <div className="service-card-inner">
                  <div className="service-top-row">
                    <div className="service-icon-wrapper">
                      <Icon size={24} className="service-main-icon" />
                    </div>
                    <span className="service-num" dir="ltr">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="service-card-title">{title}</h3>
                  <p className="service-card-desc">{tr(service.text)}</p>

                  <div className="service-card-footer">
                    {service.available ? (
                      <button
                        type="button"
                        className="service-action-btn"
                        onClick={() => handleRequestService(title)}
                      >
                        <span>{t.services.request}</span>
                        <ArrowUpRight size={16} className="service-btn-arrow" />
                      </button>
                    ) : (
                      <span className="badge-soon">{t.services.soon}</span>
                    )}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
