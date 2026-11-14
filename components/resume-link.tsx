import { site } from "@/content/site";
import { withBasePath } from "@/lib/base-path";
import { textAction } from "@/lib/ui";

export function ResumeLink() {
  return (
    <a href={withBasePath(site.contact.resumePage)} className={textAction}>
      Résumé
    </a>
  );
}
