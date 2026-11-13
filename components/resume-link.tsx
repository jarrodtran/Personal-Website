import { site } from "@/content/site";
import { withBasePath } from "@/lib/base-path";
import { textAction } from "@/lib/ui";

export function ResumeLink() {
  return (
    <a
      href={withBasePath(site.contact.resumeHref)}
      download={site.contact.resumeFilename}
      className={textAction}
    >
      Résumé
    </a>
  );
}
