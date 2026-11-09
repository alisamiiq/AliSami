import { useState } from 'react';
import { usePrefs } from '../../context/Preferences';
import { useSiteConfig } from '../../context/SiteConfig';
import { projects, projectCategories, type Project, type ProjectCategory } from '../../data/content';
import { SectionHeader } from '../ui/SectionHeader';
import { SocialIcon } from '../ui/SocialIcon';
import { ExternalLink, Info, X, Sparkles, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/** Fallback cover per category, used when a project has no `image` of its own. */
const categoryCovers: Record<ProjectCategory, string> = {
  web: '/projects/web.jpg',
  ai: '/projects/ai.jpg',
  network: '/projects/network.jpg',
};

export function Work() {
  const { t, tr } = usePrefs();
  const { sectionIndex } = useSiteConfig();
  const [activeCategory, setActiveCategory] = useState<'all' | ProjectCategory>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filteredProjects = projects.filter((p) => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  return (
    <section id="work" className="section-padding work-section" data-float-scale="1.05">
      <div className="container">
        <SectionHeader
          index={sectionIndex('work')}
          eyebrow={t.work.eyebrow}
          title={t.work.title}
          lead={t.work.lead}
          id="work-title"
        />

        {/* Category Filters */}
        <div className="work-filters" role="tablist" aria-label={t.work.filterLabel}>
          {projectCategories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`filter-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {tr(cat.label)}
                {isActive && (
                  <motion.span
                    className="filter-active-pill"
                    layoutId="work-filter-pill"
                    transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Projects Grid */}
        <div className="projects-grid">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, i) => {
              const isCurrentSite = project.id === 'ali-sami-website';
              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 28, scale: 0.97 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: '0px 0px -8% 0px' }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="project-card-shell"
                >
                <div className="project-card">
                  {/* Card visual banner / cover image */}
                  <div className="project-preview">
                    <div className="project-pattern-bg">
                      <div className="grid-overlay" />
                      <div className="floating-shape" />
                    </div>

                    <img
                      className="project-cover"
                      src={project.image ?? categoryCovers[project.category]}
                      alt={tr(project.title)}
                      width={1280}
                      height={720}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="project-cover-shade" aria-hidden="true" />

                    {/* Example flag or current site badge */}
                    <div className="project-badges">
                      {project.isExample && (
                        <span className="badge-example">
                          <Info size={12} />
                          {t.work.example}
                        </span>
                      )}
                      {isCurrentSite && (
                        <span className="badge-current">
                          <Sparkles size={12} />
                          {t.work.thisSite}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="project-body">
                    <h3 className="project-title">{tr(project.title)}</h3>
                    <p className="project-summary">{tr(project.summary)}</p>

                    {/* Tech stack tags */}
                    <div className="project-tags">
                      {project.tech.map((tag, idx) => (
                        <span key={idx} className="tech-tag" dir="ltr">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Card Actions */}
                    <div className="project-actions">
                      <button
                        type="button"
                        className="btn-card-action details"
                        onClick={() => setSelectedProject(project)}
                      >
                        <Layers size={15} />
                        <span>{t.work.details}</span>
                      </button>

                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          className="btn-card-action visit"
                          {...(project.liveUrl.startsWith('http')
                            ? { target: '_blank', rel: 'noopener noreferrer' }
                            : {})}
                        >
                          <ExternalLink size={15} />
                          <span>{t.work.visit}</span>
                        </a>
                      )}

                      {project.sourceUrl && (
                        <a
                          href={project.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-card-action visit"
                        >
                          <SocialIcon id="github" size={15} />
                          <span>{t.work.source}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredProjects.length === 0 && (
          <div className="empty-state">
            <p>{t.work.empty}</p>
          </div>
        )}
      </div>

      {/* Project Details Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div className="modal-backdrop" onClick={() => setSelectedProject(null)}>
            <motion.div
              className="modal-container"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-project-title"
            >
              <div className="modal-header">
                <div>
                  <h3 id="modal-project-title" className="modal-title">
                    {tr(selectedProject.title)}
                  </h3>
                  {selectedProject.isExample && (
                    <span className="badge-example mt-1">
                      <Info size={13} />
                      {t.work.exampleNote}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setSelectedProject(null)}
                  aria-label={t.a11y.closeDialog}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <p className="modal-description">{tr(selectedProject.description)}</p>

                <div className="modal-tech-section">
                  <h4 className="modal-tech-title">{t.work.tech}:</h4>
                  <div className="project-tags">
                    {selectedProject.tech.map((tItem, idx) => (
                      <span key={idx} className="tech-tag" dir="ltr">
                        {tItem}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                {selectedProject.liveUrl && (
                  <a
                    href={selectedProject.liveUrl}
                    className="btn btn-primary"
                    {...(selectedProject.liveUrl.startsWith('http')
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                  >
                    <span>{t.work.visit}</span>
                    <ExternalLink size={16} />
                  </a>
                )}
                {selectedProject.sourceUrl && (
                  <a
                    href={selectedProject.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    <SocialIcon id="github" size={16} />
                    <span>{t.work.source}</span>
                  </a>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedProject(null)}
                >
                  {t.a11y.closeDialog}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
