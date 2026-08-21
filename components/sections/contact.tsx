import { Download, Mail, Phone } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/brand-icons";
import { ContactForm } from "@/components/contact-form";
import { Section, SectionHeading } from "@/components/section";
import { site } from "@/content/site";

export function Contact() {
  const links = [
    {
      href: site.contact.linkedin,
      label: "LinkedIn",
      icon: LinkedInIcon,
    },
    {
      href: `mailto:${site.contact.email}`,
      label: site.contact.email,
      icon: Mail,
    },
    site.contact.phone
      ? {
          href: `tel:+1${site.contact.phone.replace(/\D/g, "")}`,
          label: site.contact.phone,
          icon: Phone,
        }
      : null,
    {
      href: site.contact.resumeHref,
      label: "Download resume",
      icon: Download,
      download: true,
    },
    site.contact.github
      ? {
          href: site.contact.github,
          label: "GitHub",
          icon: GitHubIcon,
        }
      : null,
    site.contact.calendar
      ? {
          href: site.contact.calendar,
          label: "Book a conversation",
          icon: Mail,
        }
      : null,
  ].filter((link): link is NonNullable<typeof link> => Boolean(link));

  return (
    <Section id="contact" className="bg-muted/60">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
        <div>
          <SectionHeading
            eyebrow="Let’s talk"
            title={site.contact.headline}
            description={site.contact.description}
          />
          <ul className="space-y-3">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-foreground hover:text-accent inline-flex items-center gap-2 text-sm transition-colors"
                    {...("download" in link && link.download
                      ? { download: true }
                      : {})}
                    {...(link.href.startsWith("http")
                      ? { target: "_blank", rel: "noreferrer" }
                      : {})}
                  >
                    <Icon
                      className="text-muted-foreground size-4"
                      aria-hidden="true"
                    />
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
        <ContactForm />
      </div>
    </Section>
  );
}
