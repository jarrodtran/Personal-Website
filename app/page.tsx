import { About } from "@/components/sections/about";
import { Capabilities } from "@/components/sections/capabilities";
import { Contact } from "@/components/sections/contact";
import { Experience } from "@/components/sections/experience";
import { Hero } from "@/components/sections/hero";
import { Highlights } from "@/components/sections/highlights";
import { HowIWork } from "@/components/sections/how-i-work";
import { SelectedWork } from "@/components/sections/selected-work";

export default function Home() {
  return (
    <>
      <Hero />
      <Highlights />
      <About />
      <Experience />
      <SelectedWork />
      <HowIWork />
      <Capabilities />
      <Contact />
    </>
  );
}
