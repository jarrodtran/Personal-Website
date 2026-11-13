import { ResumeLink } from "@/components/resume-link";
import { site } from "@/content/site";

export function Footer() {
  return (
    <footer className="border-border border-t">
      <div className="text-muted-foreground text-small lg:max-w-site mx-auto flex max-w-5xl flex-col gap-3 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          © {new Date().getFullYear()} {site.positioning.name}
        </p>
        <ResumeLink />
      </div>
    </footer>
  );
}
