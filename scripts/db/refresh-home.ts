// One off: overwrites the homepage hero section and SEO with the current src/content values.
// The seed never overwrites existing rows (to keep admin edits), so phase 24's new hero copy
// needs this. It replaces edits made to the hero in admin, so run it deliberately.
import { hero } from "../../src/content/home.ts";
import { seo } from "../../src/content/seo.ts";
import { connectionString, describeTarget, withClient } from "./lib.ts";

await withClient(async (client) => {
  console.log(`Target: ${describeTarget(connectionString())}`);
  await client.query(
    `update public.page_sections set data = $1::jsonb
     where type = 'hero' and page_id = (select id from public.pages where handle = 'home')`,
    [JSON.stringify(hero)],
  );
  await client.query(
    `update public.pages set seo_title = $1, seo_description = $2 where handle = 'home'`,
    [seo.home.title, seo.home.description],
  );
  console.log("Homepage hero and SEO refreshed.");
});
