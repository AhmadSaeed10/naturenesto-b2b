import "server-only";
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../../../keystatic.config";

/** Reads the Keystatic content files committed to the repo. */
export const reader = createReader(process.cwd(), keystaticConfig);
