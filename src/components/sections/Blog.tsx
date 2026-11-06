import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePrefs } from '../../context/Preferences';
import { SectionHeader } from '../ui/SectionHeader';
import { useToast } from '../ui/Toast';
import { CalendarDays, Clock, ArrowUpRight, Link2, X, Newspaper } from 'lucide-react';

/** A post published from the Telegram bot (stored in public/blog/posts.json on GitHub). */
export interface Post {
  id: string;
  title: string;
  body: string;
  date: string;
  cover?: string;
}

const URL_RE = /(https?:\/\/[^\s]+)/g;
const URL_TEST = /^https?:\/\//;

/** Plain text → paragraphs with clickable links (no HTML injection). */
function PostBody({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim());
  return (
    <>
      {paragraphs.map((para, i) => (
        <p key={i} className="post-paragraph" dir="auto">
          {para.split('\n').map((line, j, arr) => (
            <span key={j}>
              {line.split(URL_RE).map((part, k) =>
                URL_TEST.test(part) ? (
                  <a key={k} href={part} target="_blank" rel="noopener noreferrer" className="post-link">
                    {part}
                  </a>
                ) : (
                  part
                ),
              )}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}

const PAGE = 6;

export function Blog() {
  const { t, lang } = usePrefs();
  const showToast = useToast();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/blog/posts.json?v=${Date.now()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => alive && setPosts(Array.isArray(data) ? data : []))
      .catch(() => alive && setPosts([]));
    return () => {
      alive = false;
    };
  }, []);

  // Deep links: https://ali-sami.vercel.app/#post-<id>
  useEffect(() => {
    if (!posts?.length) return;
    const fromHash = () => {
      const m = window.location.hash.match(/^#post-(.+)$/);
      if (m && posts.some((p) => p.id === m[1])) {
        setOpenId(m[1]);
        document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth' });
      }
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [posts]);

  // Close on Escape
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closePost();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const fmtDate = useMemo(
    () => new Intl.DateTimeFormat(lang === 'ar' ? 'ar-IQ' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    [lang],
  );
  const readMinutes = (p: Post) => Math.max(1, Math.round((p.title + ' ' + p.body).split(/\s+/).length / 180));
  const excerpt = (p: Post) => {
    const clean = p.body.replace(/\s+/g, ' ').trim();
    return clean.length > 150 ? clean.slice(0, 150).trimEnd() + '…' : clean;
  };

  const openPost = (id: string) => {
    setOpenId(id);
    window.history.replaceState(window.history.state, '', `#post-${id}`);
  };
  function closePost() {
    setOpenId(null);
    if (window.location.hash.startsWith('#post-')) {
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
    }
  }

  const copyLink = async (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}${window.location.search}#post-${id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast(t.blog.linkCopied, 'success');
    } catch {
      /* clipboard unavailable */
    }
  };

  const visible = posts ? (showAll ? posts : posts.slice(0, PAGE)) : [];
  const selected = posts?.find((p) => p.id === openId) || null;

  return (
    <section id="blog" className="section-padding blog-section" data-float-scale="1.0">
      <div className="container">
        <SectionHeader index="06" eyebrow={t.blog.eyebrow} title={t.blog.title} lead={t.blog.lead} id="blog-title" />

        {posts === null && <p className="blog-status">{t.blog.loading}</p>}

        {posts !== null && posts.length === 0 && (
          <div className="blog-empty">
            <div className="blog-empty-icon">
              <Newspaper size={28} />
            </div>
            <p>{t.blog.empty}</p>
          </div>
        )}

        {visible.length > 0 && (
          <div className="blog-grid">
            {visible.map((post, i) => (
              <motion.article
                key={post.id}
                className="blog-card-shell"
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '0px 0px -8% 0px' }}
                transition={{ duration: 0.6, delay: (i % PAGE) * 0.07, ease: [0.22, 1, 0.36, 1] }}
              >
                <button type="button" className="blog-card" onClick={() => openPost(post.id)}>
                  <div className={`blog-cover ${post.cover ? '' : 'is-placeholder'}`}>
                    {post.cover ? (
                      <img src={post.cover} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <Newspaper size={42} aria-hidden="true" />
                    )}
                    <div className="blog-cover-shade" aria-hidden="true" />
                  </div>
                  <div className="blog-card-body">
                    <div className="blog-meta">
                      <span>
                        <CalendarDays size={13} />
                        {fmtDate.format(new Date(post.date))}
                      </span>
                      <span>
                        <Clock size={13} />
                        {readMinutes(post)} {t.blog.minRead}
                      </span>
                    </div>
                    <h3 className="blog-card-title" dir="auto">
                      {post.title}
                    </h3>
                    {post.body && (
                      <p className="blog-card-excerpt" dir="auto">
                        {excerpt(post)}
                      </p>
                    )}
                    <span className="blog-read-more">
                      {t.blog.readMore}
                      <ArrowUpRight size={15} />
                    </span>
                  </div>
                </button>
              </motion.article>
            ))}
          </div>
        )}

        {posts && posts.length > PAGE && (
          <div className="blog-more-row">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAll((v) => !v)}>
              {showAll ? t.blog.showLess : t.blog.showAll}
            </button>
          </div>
        )}
      </div>

      {/* Full article reader */}
      <AnimatePresence>
        {selected && (
          <div className="modal-backdrop" onClick={closePost}>
            <motion.div
              className="modal-container post-reader"
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="post-reader-title"
            >
              {selected.cover && <img className="post-reader-cover" src={selected.cover} alt="" />}
              <div className="post-reader-content">
                <div className="post-reader-top">
                  <div className="blog-meta">
                    <span>
                      <CalendarDays size={13} />
                      {fmtDate.format(new Date(selected.date))}
                    </span>
                    <span>
                      <Clock size={13} />
                      {readMinutes(selected)} {t.blog.minRead}
                    </span>
                  </div>
                  <div className="post-reader-actions">
                    <button
                      type="button"
                      className="modal-close-btn"
                      onClick={() => copyLink(selected.id)}
                      aria-label={t.blog.share}
                      title={t.blog.share}
                    >
                      <Link2 size={18} />
                    </button>
                    <button
                      type="button"
                      className="modal-close-btn"
                      onClick={closePost}
                      aria-label={t.a11y.closeDialog}
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                <h3 id="post-reader-title" className="post-reader-title" dir="auto">
                  {selected.title}
                </h3>
                <div className="post-reader-body">
                  <PostBody text={selected.body} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
