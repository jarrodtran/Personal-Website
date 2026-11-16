import { About } from "@/components/sections/about";
import { Approach } from "@/components/sections/approach";
import { Hero } from "@/components/sections/hero";
import { Library } from "@/components/sections/library";
import { SelectedWork } from "@/components/sections/selected-work";
import { Writing } from "@/components/sections/writing";
import { site } from "@/content/site";
import { homeMetadata } from "@/lib/metadata";
import { loadWritingResult } from "@/lib/writing";

export const metadata = homeMetadata;

export default async function Home() {
  const result = await loadWritingResult(site.substack);
  if (!result.ok) {
    console.error(`writing feed: ${result.reason}`);
  }
  const unavailable = !result.ok && result.hasUnshownPosts;

  return (
    <div
      data-testid="home-prose"
      className="w-full max-sm:[--spacing-section:1.75rem]"
    >
      <Hero latest={result.posts[0]} />
      <Writing posts={result.posts} unavailable={unavailable} />
      <About />
      <SelectedWork />
      <Approach />
      <Library />
    </div>
  );
}
