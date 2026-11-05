import { About } from "@/components/sections/about";
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
      <Contact />
      <div data-layout-probe="overflow" className="w-[200vw]">
        layout overflow probe
      </div>
      <a
        data-layout-probe="tap"
        href="#layout-probe"
        className="inline-flex text-[10px] leading-none"
      >
        tiny tap
      </a>
    </>
  );
}
