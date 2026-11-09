import { useEffect, useState } from 'react';
import { site, whatsappLink } from '../../config/site';
import { usePrefs } from '../../context/Preferences';
import { useSiteConfig } from '../../context/SiteConfig';
import { onContactTopic } from '../../lib/contactTopic';
import { SectionHeader } from '../ui/SectionHeader';
import { Reveal } from '../ui/Reveal';
import { SocialIcon } from '../ui/SocialIcon';
import { useToast } from '../ui/Toast';
import { ArrowUpRight, MessageSquare, Sparkles } from 'lucide-react';

export function Contact() {
  const { t, tr } = usePrefs();
  const { sectionIndex } = useSiteConfig();
  const showToast = useToast();

  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');

  // Listen to topic triggers from Service buttons
  useEffect(() => {
    return onContactTopic((requestedTopic) => {
      setTopic(requestedTopic);
    });
  }, []);

  const handleSendWhatsapp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      showToast(t.contact.emptyMessage, 'info');
      return;
    }
    const topicLine = topic.trim() ? `[${topic.trim()}]\n` : '';
    const fullText = `${t.contact.greeting}\n${topicLine}${message.trim()}`;
    const url = whatsappLink(fullText);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSendTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      showToast(t.contact.emptyMessage, 'info');
      return;
    }
    const topicLine = topic.trim() ? `[${topic.trim()}]\n` : '';
    const fullText = `${t.contact.greeting}\n${topicLine}${message.trim()}`;

    try {
      await navigator.clipboard.writeText(fullText);
      showToast(t.contact.copied, 'success');
    } catch {
      showToast(t.contact.copyFailed, 'info');
    }

    const tgUrl = site.social.find((s) => s.id === 'telegram')?.url || '#';
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="contact" className="section-padding contact-section" data-float-scale="1.0">
      <div className="container">
        <SectionHeader
          index={sectionIndex('contact')}
          eyebrow={t.contact.eyebrow}
          title={t.contact.title}
          lead={t.contact.lead}
          id="contact-title"
        />

        <div className="contact-grid">
          {/* Direct Social Cards */}
          <div className="contact-channels-col">
            <div className="channels-list">
              {site.social.map((s, idx) => (
                <Reveal key={s.id} delay={idx * 0.1} className="channel-card">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="channel-card-inner"
                  >
                    <div className="channel-icon-box">
                      <SocialIcon id={s.id} size={24} />
                    </div>
                    <div className="channel-info">
                      <h4 className="channel-name">{tr(s.label)}</h4>
                      <p className="channel-handle" dir="ltr">
                        {s.handle}
                      </p>
                    </div>
                    <div className="channel-arrow">
                      <ArrowUpRight size={18} />
                    </div>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Quick Message Composer (Privacy-first: no backend storage, directly sends via WhatsApp/Telegram) */}
          <Reveal delay={0.2} className="contact-composer-col">
            <div className="composer-card">
              <div className="composer-header">
                <div className="composer-title-wrapper">
                  <MessageSquare size={18} className="text-electric" />
                  <h3 className="composer-title">{t.contact.composerTitle}</h3>
                </div>
                <span className="privacy-badge">
                  <Sparkles size={13} />
                  100% Private
                </span>
              </div>
              <p className="composer-note">{t.contact.composerNote}</p>

              <form className="composer-form">
                <div className="form-group">
                  <label htmlFor="contact-topic" className="form-label">
                    {t.contact.topic}
                  </label>
                  <div className="quick-topics-row" role="group" aria-label={t.contact.topic}>
                    {t.contact.quickTopics.map((qt) => {
                      const isSelected = topic === qt;
                      return (
                        <button
                          key={qt}
                          type="button"
                          className={`quick-topic-chip ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => setTopic(isSelected ? '' : qt)}
                        >
                          {qt}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    id="contact-topic"
                    type="text"
                    className="form-input"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={t.contact.topicGeneral}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-message" className="form-label">
                    {t.contact.message}
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    className="form-textarea"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t.contact.placeholder}
                    required
                  />
                </div>

                <div className="composer-actions">
                  <button
                    type="button"
                    className="btn btn-whatsapp"
                    onClick={handleSendWhatsapp}
                  >
                    <SocialIcon id="whatsapp" size={17} />
                    <span>{t.contact.sendWhatsapp}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-telegram"
                    onClick={handleSendTelegram}
                  >
                    <SocialIcon id="telegram" size={17} />
                    <span>{t.contact.sendTelegram}</span>
                  </button>
                </div>
              </form>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
