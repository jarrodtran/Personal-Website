import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Experience } from "@/components/sections/experience";
import { Hero } from "@/components/sections/hero";
import { HowIWork } from "@/components/sections/how-i-work";
import { SelectedWork } from "@/components/sections/selected-work";
import { Writing } from "@/components/sections/writing";
import { site } from "@/content/site";
import { loadWritingResult } from "@/lib/writing";

export default async function Home() {
  const result = await loadWritingResult(site.substack);
  if (!result.ok) {
    // Build-time visibility: a dead feed otherwise ships silently as the
    // empty Writing state.
    console.error(`writing feed: ${result.reason}; Writing renders its empty state`);
  }
  const posts = result.posts;

  return (
    <div
      data-testid="home-prose"
      className="mx-auto w-full max-w-[var(--container-prose)]"
    >
      <Hero />
      <Writing posts={posts} />
      <About />
      <Experience />
      <SelectedWork />
      <HowIWork />
      <Contact />
    </div>
  );
}
