import { site } from "@/content/site";

export function Footer() {
  return (
    <footer className="border-border border-t">
      <div className="text-muted-foreground mx-auto flex max-w-5xl flex-col gap-3 px-5 py-10 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          © {new Date().getFullYear()} {site.positioning.name}
        </p>
        <p>
          {site.positioning.location}
          <span aria-hidden="true"> · </span>
          Tesla · Apple · Waymo
        </p>
      </div>
    </footer>
  );
}
