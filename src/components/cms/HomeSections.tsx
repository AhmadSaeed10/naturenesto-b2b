import { HERO_NEXT_ID, Hero } from "@/components/sections/Hero";
import {
  HomeExplore,
  HomeFinal,
  HomeIntro,
  HomeMarketplace,
  HomeProjects,
  HomeSolutions,
  HomeSpaces,
  HomeWhy,
} from "@/components/sections/HomeWorld";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { NeedHelp } from "@/components/sections/NeedHelp";
import { PlantsForEveryone } from "@/components/sections/PlantsForEveryone";
import { TaglineStrip } from "@/components/sections/TaglineStrip";
import type { HomeSections as HomeSectionsData } from "@/lib/cms/sections";

/** Homepage sections in their fixed order; a hidden section (null) is skipped. */
export function HomeSections({ sections }: { sections: HomeSectionsData }) {
  return (
    <>
      {sections.hero ? <Hero data={sections.hero} /> : null}
      {sections.tagline ? <TaglineStrip id={HERO_NEXT_ID} data={sections.tagline} /> : null}
      <HomeIntro />
      <HomeExplore />
      <HomeSolutions />
      <HomeMarketplace />
      <HomeSpaces />
      <HomeProjects />
      <HomeWhy />
      {sections.how_it_works ? <HowItWorks data={sections.how_it_works} /> : null}
      {sections.plants ? <PlantsForEveryone data={sections.plants} /> : null}
      <HomeFinal />
      {sections.need_help ? <NeedHelp data={sections.need_help} /> : null}
    </>
  );
}
