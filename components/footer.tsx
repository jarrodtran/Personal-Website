import { ArrowUpRight } from "lucide-react";
import { ResumeLink } from "@/components/resume-link";
import { site } from "@/content/site";
import { textAction } from "@/lib/ui";

export function Footer() {
  const { email, linkedin } = site.contact;

  return (
    <footer className="border-border border-t">
      <div className="text-muted-foreground text-small lg:max-w-site mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ul
            role="list"
            className="flex flex-wrap items-center gap-x-6 gap-y-1"
          >
            <li>
              <a
                href={`mailto:${email}`}
                className={`${textAction} min-w-11 justify-center`}
              >
                Email
              </a>
            </li>
            <li>
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className={textAction}
              >
                LinkedIn
                <ArrowUpRight
                  className="size-[16px] shrink-0"
                  aria-hidden="true"
                />
              </a>
            </li>
            <li>
              <ResumeLink />
            </li>
          </ul>
          <p>
            © {new Date().getFullYear()} {site.positioning.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
