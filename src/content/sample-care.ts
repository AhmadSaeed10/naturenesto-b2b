import type { Care } from "@/lib/care";

// Care facts for the sample plants, so a sample product page shows the same care grid a live
// product will. Pet safety is only set where it is well established; empty means "not shown".
// flag: placeholder content. Replace with the real catalogue's care data before launch.

type Facts = Partial<Pick<Care, "light" | "water" | "pet" | "level">>;

export const sampleCare: Record<string, Facts> = {
  monstera: { light: "medium", water: "moderate", pet: "toxic", level: "easy" },
  "snake-plant": { light: "low", water: "low", pet: "toxic", level: "easy" },
  "zz-plant": { light: "low", water: "low", pet: "toxic", level: "easy" },
  "golden-pothos": { light: "medium", water: "moderate", pet: "toxic", level: "easy" },
  "peace-lily": { light: "medium", water: "moderate", pet: "toxic", level: "easy" },
  "fiddle-leaf-fig": { light: "bright", water: "moderate", pet: "toxic", level: "moderate" },
  calathea: { light: "medium", water: "frequent", pet: "safe", level: "moderate" },
  "spider-plant": { light: "medium", water: "moderate", pet: "safe", level: "easy" },
  "boston-fern": { light: "medium", water: "frequent", pet: "safe", level: "moderate" },
  "areca-palm": { light: "bright", water: "moderate", pet: "safe", level: "easy" },
  "rubber-plant": { light: "bright", water: "moderate", pet: "toxic", level: "easy" },
  "phalaenopsis-white": { light: "medium", water: "low", pet: "safe", level: "moderate" },
  "phalaenopsis-blush": { light: "medium", water: "low", pet: "safe", level: "moderate" },
  dendrobium: { light: "bright", water: "low", pet: "safe", level: "moderate" },
  "orchid-trio": { light: "medium", water: "low", pet: "safe", level: "moderate" },
  "aloe-vera": { light: "bright", water: "low", pet: "toxic", level: "easy" },
  "jade-plant": { light: "bright", water: "low", pet: "toxic", level: "easy" },
  bougainvillea: { light: "bright", water: "moderate", level: "easy" },
  hibiscus: { light: "bright", water: "frequent", level: "moderate" },
  "olive-tree": { light: "bright", water: "low", level: "easy" },
  "bird-of-paradise": { light: "bright", water: "moderate", level: "moderate" },
};
