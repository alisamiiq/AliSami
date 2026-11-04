import { site, whatsappLink } from '../../config/site';
import { usePrefs } from '../../context/Preferences';
import { internetFeatures } from '../../data/content';
import { SectionHeader } from '../ui/SectionHeader';
import { Reveal } from '../ui/Reveal';
import { SocialIcon } from '../ui/SocialIcon';
import { MapPin, Clock, Phone, ExternalLink, ShieldCheck } from 'lucide-react';

export function InternetService() {
  const { t, tr } = usePrefs();

  const directWhatsapp = whatsappLink(t.internet.whatsappMessage);
  const telegramLink = site.social.find((s) => s.id === 'telegram')?.url || '#';

  return (
    <section id="internet" className="section-padding internet-section" data-float-scale="1.0">
      <div className="container">
        <SectionHeader
          index="05"
          eyebrow={t.internet.eyebrow}
          title={t.internet.title}
          lead={t.internet.lead}
          id="internet-title"
        />

        {/* Feature Cards Grid */}
        <div className="internet-features-grid">
          {internetFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Reveal key={idx} delay={idx * 0.08} className="internet-card">
                <div className="internet-card-glow" aria-hidden="true" />
                <div className="internet-card-pattern" aria-hidden="true" />
                <div className="internet-watermark" aria-hidden="true">
                  <Icon size={125} />
                </div>
                <div className="internet-icon-box">
                  <Icon size={24} className="text-electric" />
                </div>
                <h4 className="internet-card-title">{tr(feat.title)}</h4>
                <p className="internet-card-text">{tr(feat.text)}</p>
              </Reveal>
            );
          })}
        </div>

        {/* Info Box & Direct Inquiry Banner */}
        <div className="internet-action-banner">
          <div className="banner-details">
            <div className="location-pill">
              <MapPin size={16} className="text-electric" />
              <span>{tr(site.location)}</span>
            </div>

            <h3 className="banner-heading">{t.internet.info}</h3>
            <p className="banner-note">{t.internet.askNote}</p>

            {/* Optional details (only rendered if specified, no fake data) */}
            <div className="optional-details-list">
              {site.internetService.workingHours && (
                <div className="detail-item">
                  <Clock size={16} className="text-electric" />
                  <span>
                    <strong>{t.internet.hours}:</strong> {tr(site.internetService.workingHours)}
                  </span>
                </div>
              )}
              {site.internetService.phone && (
                <div className="detail-item">
                  <Phone size={16} className="text-electric" />
                  <span>
                    <strong>{t.internet.phone}:</strong> {site.internetService.phone}
                  </span>
                </div>
              )}
              {site.internetService.coverage && (
                <div className="detail-item">
                  <ShieldCheck size={16} className="text-electric" />
                  <span>
                    <strong>{t.internet.coverage}:</strong> {tr(site.internetService.coverage)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick contact buttons */}
          <div className="banner-actions">
            <a
              href={directWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp"
            >
              <SocialIcon id="whatsapp" size={18} />
              <span>{t.internet.askWhatsapp}</span>
            </a>

            <a
              href={telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-telegram"
            >
              <SocialIcon id="telegram" size={18} />
              <span>{t.internet.askTelegram}</span>
            </a>

            <a
              href={site.internetService.mapSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-map"
            >
              <MapPin size={16} />
              <span>{t.internet.openMap}</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
