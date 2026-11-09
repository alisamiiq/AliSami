import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export interface SiteConfigData {
  hiddenSections: string[];
  updatedAt?: string;
}

interface SiteConfigContextValue {
  hiddenSections: string[];
  isSectionVisible: (sectionId: string) => boolean;
  sectionIndex: (sectionId: string) => string;
  blogHubOpen: boolean;
  activePostId: string | null;
  openBlogHub: (postId?: string) => void;
  closeBlogHub: () => void;
  visits: number | null;
}

const SECTION_ORDER = ['about', 'services', 'work', 'studies', 'internet', 'blog', 'contact'];

const SiteConfigContext = createContext<SiteConfigContextValue>({
  hiddenSections: [],
  isSectionVisible: () => true,
  sectionIndex: (id) => String(SECTION_ORDER.indexOf(id) + 1).padStart(2, '0'),
  blogHubOpen: false,
  activePostId: null,
  openBlogHub: () => {},
  closeBlogHub: () => {},
  visits: null,
});

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [hiddenSections, setHiddenSections] = useState<string[]>([]);
  const [blogHubOpen, setBlogHubOpen] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [visits, setVisits] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/blog/site-config.json?v=${Date.now()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { hiddenSections: [] }))
      .then((data: SiteConfigData) => {
        if (alive && Array.isArray(data?.hiddenSections)) {
          setHiddenSections(data.hiddenSections);
        }
      })
      .catch(() => {});

    // Record visit & get live counter
    fetch(`/api/telegram?action=visit&hit=1&t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && typeof data?.visits === 'number') {
          setVisits(data.visits);
        }
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  const isSectionVisible = useCallback(
    (sectionId: string) => !hiddenSections.includes(sectionId),
    [hiddenSections],
  );

  // Section numbers follow the visible sections only (no gaps when one is hidden from the bot)
  const sectionIndex = useCallback(
    (sectionId: string) => {
      const visible = SECTION_ORDER.filter((id) => !hiddenSections.includes(id));
      const pos = visible.indexOf(sectionId);
      return String((pos === -1 ? SECTION_ORDER.indexOf(sectionId) : pos) + 1).padStart(2, '0');
    },
    [hiddenSections],
  );

  const openBlogHub = useCallback((postId?: string) => {
    setBlogHubOpen(true);
    if (postId) {
      setActivePostId(postId);
      window.history.replaceState(window.history.state, '', `#post-${postId}`);
    } else {
      setActivePostId(null);
      window.history.replaceState(window.history.state, '', '#blog-hub');
    }
  }, []);

  const closeBlogHub = useCallback(() => {
    setBlogHubOpen(false);
    setActivePostId(null);
    if (window.location.hash.startsWith('#post-') || window.location.hash === '#blog-hub') {
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
    }
  }, []);

  // Listen to URL hash for deep links (#blog-hub or #post-<id>)
  useEffect(() => {
    const checkHash = () => {
      const h = window.location.hash;
      if (h === '#blog-hub') {
        setBlogHubOpen(true);
        setActivePostId(null);
      } else {
        const m = h.match(/^#post-(.+)$/);
        if (m) {
          setBlogHubOpen(true);
          setActivePostId(m[1]);
        }
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  return (
    <SiteConfigContext.Provider
      value={{
        hiddenSections,
        isSectionVisible,
        sectionIndex,
        blogHubOpen,
        activePostId,
        openBlogHub,
        closeBlogHub,
        visits,
      }}
    >
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}
