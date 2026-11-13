import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Hero } from "@/components/sections/hero";
import { SelectedWork } from "@/components/sections/selected-work";
import { Writing } from "@/components/sections/writing";
import { site } from "@/content/site";
import { loadWritingResult } from "@/lib/writing";

export default async function Home() {
  const result = await loadWritingResult(site.substack);
  if (!result.ok) {
    console.error(`writing feed: ${result.reason}`);
  }

  return (
    <div
      data-testid="home-prose"
      className="mx-auto w-full max-w-5xl px-5 sm:px-8"
    >
      <div className="w-full max-w-[var(--container-prose)] [&_#top>div]:px-0 [&_section>div]:px-0">
        <Hero />
        <Writing posts={result.posts} unavailable={!result.ok} />
        <About />
        <SelectedWork />
        <Contact />
      </div>
    </div>
  );
}
