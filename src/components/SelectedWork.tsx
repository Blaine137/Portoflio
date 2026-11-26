import { portfolio, type Project } from '../lib/portfolio';
import { Icon } from './Icon';

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="project">
      <div
        className={`project-art ${project.id}`}
        aria-hidden="true"
      >
        <div className="project-art-pattern" />
        <Icon name="layers" />
        <span className="project-domain">{project.domain}</span>
      </div>
      <div className="project-body">
        <p className="project-company">{project.category}</p>
        <h2>{project.title}</h2>
        <p>{project.description}</p>
        <a
          className="text-link"
          href={project.url}
          aria-label={`Visit ${project.title}`}
        >
          Visit website
        </a>
      </div>
    </article>
  );
}

export function SelectedWork() {
  return (
    <section
      aria-label="Project websites"
      className="work-section"
    >
      <div className="shell projects">
        {portfolio.work.projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
          />
        ))}
      </div>
    </section>
  );
}
