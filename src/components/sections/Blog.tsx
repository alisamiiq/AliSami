import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePrefs } from '../../context/Preferences';
import { useSiteConfig } from '../../context/SiteConfig';
import { useToast } from '../ui/Toast';
import {
  CalendarDays,
  Clock,
  ArrowUpRight,
  Link2,
  X,
  Newspaper,
  Search,
  Pin,
  Hash,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  BookOpen,
} from 'lucide-react';

/** A post published from the Telegram bot (stored in public/blog/posts.json on GitHub). */
export interface Post {
  id: string;
  title: string;
  body: string;
  date: string;
  cover?: string;
  tags?: string[];
  pinned?: boolean;
  hidden?: boolean;
  updatedAt?: string;
}

const URL_RE = /(https?:\/\/[^\s]+)/g;
const URL_TEST = /^https?:\/\//;

/** Extract tags either from post.tags or inline #hashtags */
function getPostTags(post: Post): string[] {
  if (Array.isArray(post.tags) && post.tags.length > 0) {
    return post.tags;
  }
  const matches = post.body.match(/#([\p{L}\p{N}_]+)/gu) || [];
  return Array.from(new Set(matches.map((m) => m.slice(1).replace(/_/g, ' '))));
}

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

export function Blog() {
  const { t, lang } = usePrefs();
  const { isSectionVisible, sectionIndex, blogHubOpen, activePostId, openBlogHub, closeBlogHub } = useSiteConfig();
  const showToast = useToast();

  const [rawPosts, setRawPosts] = useState<Post[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string>('__all__');

  useEffect(() => {
    let alive = true;
    fetch(`/blog/posts.json?v=${Date.now()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => alive && setRawPosts(Array.isArray(data) ? data : []))
      .catch(() => alive && setRawPosts([]));
    return () => {
      alive = false;
    };
  }, []);

  // Filter out hidden posts and sort pinned first, then newest first
  const posts = useMemo(() => {
    if (!rawPosts) return null;
    return rawPosts
      .filter((p) => !p.hidden)
      .sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [rawPosts]);

  // All unique tags across visible posts
  const allTags = useMemo(() => {
    if (!posts) return [];
    const set = new Set<string>();
    for (const p of posts) {
      for (const tag of getPostTags(p)) {
        set.add(tag);
      }
    }
    return Array.from(set);
  }, [posts]);

  const hasPinned = useMemo(() => Boolean(posts?.some((p) => p.pinned)), [posts]);

  // Filtered posts inside the Hub
  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    const q = searchQuery.trim().toLowerCase();
    return posts.filter((p) => {
      const pTags = getPostTags(p);
      if (activeTag === '__pinned__' && !p.pinned) return false;
      if (activeTag !== '__all__' && activeTag !== '__pinned__' && !pTags.includes(activeTag)) {
        return false;
      }
      if (!q) return true;
      const inTitle = p.title.toLowerCase().includes(q);
      const inBody = p.body.toLowerCase().includes(q);
      const inTags = pTags.some((tag) => tag.toLowerCase().includes(q));
      return inTitle || inBody || inTags;
    });
  }, [posts, searchQuery, activeTag]);

  // Lock body scroll when Full-Screen Hub is open
  useEffect(() => {
    if (!blogHubOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [blogHubOpen]);

  // Escape key handling inside Hub
  useEffect(() => {
    if (!blogHubOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activePostId) {
          openBlogHub(); // Go back to Hub grid
        } else {
          closeBlogHub();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [blogHubOpen, activePostId, openBlogHub, closeBlogHub]);

  const fmtDate = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === 'ar' ? 'ar-IQ' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [lang],
  );

  const readMinutes = (p: Post) =>
    Math.max(1, Math.round((p.title + ' ' + p.body).split(/\s+/).length / 180));

  const excerpt = (p: Post, max = 145) => {
    const clean = p.body.replace(/\s+/g, ' ').trim();
    return clean.length > max ? clean.slice(0, max).trimEnd() + '…' : clean;
  };

  const copyLink = async (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}${window.location.search}#post-${id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast(t.blog.linkCopied, 'success');
    } catch {
      /* clipboard unavailable */
    }
  };

  const featuredPost = posts && posts.length > 0 ? posts[0] : null;
  const selectedPost = posts?.find((p) => p.id === activePostId) || null;
  const BackIcon = lang === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <>
      {/* Compact Gateway Section on the Main Page (No Post Clutter!) */}
      {isSectionVisible('blog') && (
        <section id="blog" className="section-padding blog-section" data-float-scale="1.0">
          <div className="container">
            <motion.div
              className="blog-gateway-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px 0px -8% 0px' }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="blog-gateway-glow" aria-hidden="true" />

              {/* Gateway Left / Start Info */}
              <div className="blog-gateway-info">
                <div className="blog-gateway-eyebrow">
                  <span className="section-index">{sectionIndex('blog')}</span>
                  <span className="eyebrow-divider" />
                  <Sparkles size={14} className="blog-gateway-sparkle" />
                  <span>{t.blog.eyebrow}</span>
                </div>

                <h2 className="blog-gateway-title">{t.blog.title}</h2>
                <p className="blog-gateway-lead">{t.blog.lead}</p>

                <div className="blog-gateway-stats">
                  <span className="blog-stat-pill">
                    <BookOpen size={14} />
                    <strong>{posts ? posts.length : '…'}</strong> {t.blog.postsCount}
                  </span>
                  {allTags.slice(0, 4).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="blog-tag-chip is-interactive"
                      onClick={() => {
                        setActiveTag(tag);
                        openBlogHub();
                      }}
                    >
                      <Hash size={12} />
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="blog-gateway-actions">
                  <button
                    type="button"
                    className="btn btn-primary blog-open-hub-btn"
                    onClick={() => openBlogHub()}
                  >
                    <Newspaper size={18} />
                    <span>{t.blog.openHub}</span>
                    <ArrowUpRight size={17} />
                  </button>
                </div>
              </div>

              {/* Gateway Right / End Featured Spotlight (1 card max, never cluttered) */}
              <div className="blog-gateway-spotlight">
                {featuredPost ? (
                  <button
                    type="button"
                    className="blog-spotlight-card"
                    onClick={() => openBlogHub(featuredPost.id)}
                  >
                    <div className="blog-spotlight-top">
                      <span className={`blog-badge ${featuredPost.pinned ? 'is-pinned' : 'is-latest'}`}>
                        {featuredPost.pinned ? <Pin size={12} /> : <Sparkles size={12} />}
                        {featuredPost.pinned ? t.blog.pinnedBadge : t.blog.latestBadge}
                      </span>
                      <span className="blog-spotlight-date">
                        <CalendarDays size={13} />
                        {fmtDate.format(new Date(featuredPost.date))}
                      </span>
                    </div>

                    <h3 className="blog-spotlight-title" dir="auto">
                      {featuredPost.title}
                    </h3>

                    {featuredPost.body && (
                      <p className="blog-spotlight-excerpt" dir="auto">
                        {excerpt(featuredPost, 120)}
                      </p>
                    )}

                    <div className="blog-spotlight-footer">
                      <span className="blog-read-more">
                        {t.blog.readMore}
                        <ArrowUpRight size={15} />
                      </span>
                      <span className="blog-spotlight-time">
                        <Clock size={12} />
                        {readMinutes(featuredPost)} {t.blog.minRead}
                      </span>
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="blog-spotlight-card is-empty"
                    onClick={() => openBlogHub()}
                  >
                    <div className="blog-empty-icon">
                      <Newspaper size={28} />
                    </div>
                    <p>{t.blog.empty}</p>
                    <span className="blog-read-more">
                      {t.blog.openHub}
                      <ArrowUpRight size={15} />
                    </span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Full-Screen Standalone Blog Hub Portal */}
      <AnimatePresence>
        {blogHubOpen && (
          <motion.div
            className="blog-hub-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="blog-hub-heading"
          >
            <motion.div
              className="blog-hub-shell"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Sticky Hub Top Bar */}
              <header className="blog-hub-header">
                <div className="container blog-hub-header-inner">
                  <div className="blog-hub-brand">
                    <div className="blog-hub-icon">
                      <Newspaper size={20} />
                    </div>
                    <div>
                      <h2 id="blog-hub-heading" className="blog-hub-title">
                        {t.blog.title}
                      </h2>
                      <p className="blog-hub-subtitle">{t.blog.hubSubtitle}</p>
                    </div>
                  </div>

                  <div className="blog-hub-header-actions">
                    {selectedPost && (
                      <button
                        type="button"
                        className="btn btn-secondary blog-hub-back-btn"
                        onClick={() => openBlogHub()}
                      >
                        <BackIcon size={16} />
                        <span>{t.blog.backToList}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="blog-hub-close-btn"
                      onClick={closeBlogHub}
                      aria-label={t.blog.closeHub}
                      title={t.blog.closeHub}
                    >
                      <X size={20} />
                      <span className="blog-hub-close-label">{t.blog.closeHub}</span>
                    </button>
                  </div>
                </div>
              </header>

              {/* Hub Scrollable Body */}
              <div className="blog-hub-body">
                <div className="container">
                  {selectedPost ? (
                    /* ─── Full Article Reader View inside Hub ─── */
                    <motion.article
                      key={selectedPost.id}
                      className="hub-article-reader"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28 }}
                    >
                      {selectedPost.cover && (
                        <div className="hub-reader-cover-wrap">
                          <img className="hub-reader-cover" src={selectedPost.cover} alt="" />
                        </div>
                      )}

                      <div className="hub-reader-content">
                        <div className="post-reader-top">
                          <div className="blog-meta">
                            {selectedPost.pinned && (
                              <span className="blog-badge is-pinned">
                                <Pin size={12} />
                                {t.blog.pinnedBadge}
                              </span>
                            )}
                            <span>
                              <CalendarDays size={14} />
                              {fmtDate.format(new Date(selectedPost.date))}
                            </span>
                            <span>
                              <Clock size={14} />
                              {readMinutes(selectedPost)} {t.blog.minRead}
                            </span>
                          </div>

                          <div className="post-reader-actions">
                            <button
                              type="button"
                              className="btn btn-secondary blog-share-btn"
                              onClick={() => copyLink(selectedPost.id)}
                            >
                              <Link2 size={16} />
                              <span>{t.blog.share}</span>
                            </button>
                          </div>
                        </div>

                        <h1 className="post-reader-title" dir="auto">
                          {selectedPost.title}
                        </h1>

                        {getPostTags(selectedPost).length > 0 && (
                          <div className="blog-card-tags hub-reader-tags">
                            {getPostTags(selectedPost).map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                className="blog-tag-chip is-interactive"
                                onClick={() => {
                                  setActiveTag(tag);
                                  openBlogHub();
                                }}
                              >
                                <Hash size={12} />
                                {tag}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="post-reader-body">
                          <PostBody text={selectedPost.body} />
                        </div>
                      </div>
                    </motion.article>
                  ) : (
                    /* ─── Hub Explorer View (Search + Tags + Cards Grid) ─── */
                    <>
                      {/* Toolbar: Search + Tag Filters */}
                      <div className="blog-hub-toolbar">
                        <div className="blog-search-box">
                          <Search size={18} className="blog-search-icon" />
                          <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t.blog.searchPlaceholder}
                            className="blog-search-input"
                          />
                          {searchQuery && (
                            <button
                              type="button"
                              className="blog-search-clear"
                              onClick={() => setSearchQuery('')}
                              aria-label="Clear search"
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>

                        <div className="blog-filter-pills" role="tablist">
                          <button
                            type="button"
                            className={`blog-filter-pill ${activeTag === '__all__' ? 'is-active' : ''}`}
                            onClick={() => setActiveTag('__all__')}
                          >
                            <span>{t.blog.allCategories}</span>
                            <span className="pill-count">{posts ? posts.length : 0}</span>
                          </button>

                          {hasPinned && (
                            <button
                              type="button"
                              className={`blog-filter-pill ${activeTag === '__pinned__' ? 'is-active' : ''}`}
                              onClick={() => setActiveTag('__pinned__')}
                            >
                              <Pin size={13} />
                              <span>{t.blog.pinnedFilter}</span>
                            </button>
                          )}

                          {allTags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              className={`blog-filter-pill ${activeTag === tag ? 'is-active' : ''}`}
                              onClick={() => setActiveTag(tag)}
                            >
                              <Hash size={13} />
                              <span>{tag}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Posts Status / Grid */}
                      {posts === null && <p className="blog-status">{t.blog.loading}</p>}

                      {posts !== null && posts.length === 0 && (
                        <div className="blog-empty">
                          <div className="blog-empty-icon">
                            <Newspaper size={28} />
                          </div>
                          <p>{t.blog.empty}</p>
                        </div>
                      )}

                      {posts !== null && posts.length > 0 && filteredPosts.length === 0 && (
                        <div className="blog-empty">
                          <div className="blog-empty-icon">
                            <Search size={26} />
                          </div>
                          <p>{t.blog.noSearchMatch}</p>
                        </div>
                      )}

                      {filteredPosts.length > 0 && (
                        <div className="blog-grid">
                          {filteredPosts.map((post, i) => {
                            const postTags = getPostTags(post);
                            return (
                              <motion.article
                                key={post.id}
                                className="blog-card-shell"
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3) }}
                              >
                                <button
                                  type="button"
                                  className={`blog-card ${post.pinned ? 'is-pinned-card' : ''}`}
                                  onClick={() => openBlogHub(post.id)}
                                >
                                  <div className={`blog-cover ${post.cover ? '' : 'is-placeholder'}`}>
                                    {post.cover ? (
                                      <img src={post.cover} alt="" loading="lazy" decoding="async" />
                                    ) : (
                                      <Newspaper size={42} aria-hidden="true" />
                                    )}
                                    <div className="blog-cover-shade" aria-hidden="true" />
                                    {post.pinned && (
                                      <span className="blog-card-pin-badge">
                                        <Pin size={12} />
                                        {t.blog.pinnedBadge}
                                      </span>
                                    )}
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

                                    {postTags.length > 0 && (
                                      <div className="blog-card-tags">
                                        {postTags.slice(0, 3).map((tag) => (
                                          <span key={tag} className="blog-tag-chip">
                                            #{tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    <span className="blog-read-more">
                                      {t.blog.readMore}
                                      <ArrowUpRight size={15} />
                                    </span>
                                  </div>
                                </button>
                              </motion.article>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
