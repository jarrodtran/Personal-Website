import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";

/**
 * Six principles as an ordered list in the content column. One rule above the
 * list matches the Selected work rows. From lg the list runs in two columns
 * (items fill left to right, so the numbers still read in order).
 */
export function Approach() {
  const { title, principles } = site.approach;
  return (
    <Section id="approach">
      <SectionHeading title={title} />
      <ol
        role="list"
        className="border-border grid grid-cols-1 gap-x-10 border-t lg:grid-cols-2"
      >
        {principles.map(({ title: name, body }, index) => (
          <li
            key={name}
            className="border-border grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 border-b py-5 lg:[&:nth-last-child(-n+2)]:border-b-0"
          >
            <span
              aria-hidden="true"
              className="tabular text-muted-foreground text-small pt-1"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-[length:var(--text-h3)] leading-[var(--leading-title)] text-balance">
                {name}
              </h3>
              <p className="text-foreground measure text-body mt-1 leading-[var(--leading-copy)]">
                {body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
