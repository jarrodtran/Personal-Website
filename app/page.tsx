import { About } from "@/components/sections/about";
import { Capabilities } from "@/components/sections/capabilities";
import { Contact } from "@/components/sections/contact";
import { Experience } from "@/components/sections/experience";
import { Hero } from "@/components/sections/hero";
import { HowIWork } from "@/components/sections/how-i-work";
import { SelectedWork } from "@/components/sections/selected-work";
import { Writing } from "@/components/sections/writing";
import { site } from "@/content/site";
import { loadWriting } from "@/lib/writing";

export default async function Home() {
  const posts = await loadWriting(site.substack);

  return (
    <>
      <Hero />
      <Writing posts={posts} />
      <About />
      <Experience />
      <SelectedWork />
      <HowIWork />
      <Capabilities />
      <Contact />
    </>
  );
}
