import { CtaBand } from "@/components/pages/CtaBand";
import { PageHero } from "@/components/pages/PageHero";
import { ProjectsGrid } from "@/components/pages/ProjectsGrid";
import { photoImage } from "@/content/photos";
import { projects, projectsPage as copy } from "@/content/projects";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Projects",
  description: copy.intro,
  path: "/projects",
});

export default function ProjectsPage() {
  return (
    <>
      <PageHero
        eyebrow={copy.eyebrow}
        title={copy.title}
        intro={copy.intro}
        image={photoImage("olive-a", "An olive tree in an open garden space")}
      />
      <ProjectsGrid
        allLabel={copy.all}
        projects={projects.map((project) => ({
          slug: project.slug,
          title: project.title,
          location: project.location,
          type: project.type,
          summary: project.summary,
          image: photoImage(project.photo, project.photoAlt),
        }))}
      />
      <CtaBand {...copy.cta} />
    </>
  );
}
