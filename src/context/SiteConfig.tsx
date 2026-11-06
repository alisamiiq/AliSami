import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export interface SiteConfigData {
  hiddenSections: string[];
  updatedAt?: string;
}

interface SiteConfigContextValue {
  hiddenSections: string[];
  isSectionVisible: (sectionId: string) => boolean;
  blogHubOpen: boolean;
  activePostId: string | null;
  openBlogHub: (postId?: string) => void;
  closeBlogHub: () => void;
}

const SiteConfigContext = createContext<SiteConfigContextValue>({
  hiddenSections: [],
  isSectionVisible: () => true,
  blogHubOpen: false,
  activePostId: null,
  openBlogHub: () => {},
  closeBlogHub: () => {},
});

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [hiddenSections, setHiddenSections] = useState<string[]>([]);
  const [blogHubOpen, setBlogHubOpen] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);

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
    return () => {
      alive = false;
    };
  }, []);

  const isSectionVisible = useCallback(
    (sectionId: string) => !hiddenSections.includes(sectionId),
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
        blogHubOpen,
        activePostId,
        openBlogHub,
        closeBlogHub,
      }}
    >
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}

