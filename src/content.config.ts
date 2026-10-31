import { defineCollection } from "astro:content";
import { glob, file } from "astro/loaders";
import { z } from "astro/zod";

const reviews = defineCollection({
    loader: glob({ base: "./src/content/reviews", pattern: "**/*.{md,mdx}"}), 
    schema: z.object({
        game_title: z.string(),
        date: z.date(),
        written_by: z.optional(z.string())
    })
});

export const collections = { reviews };
