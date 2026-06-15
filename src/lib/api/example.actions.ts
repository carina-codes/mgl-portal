"use server";

import { z } from "zod";
import { getServerConfig } from "../config.server";

const greetingSchema = z.object({ name: z.string().min(1) });

export async function getGreeting(data: { name: string }) {
  const parsed = greetingSchema.parse(data);
  const config = getServerConfig();
  return {
    greeting: `Hello, ${parsed.name}!`,
    mode: config.nodeEnv ?? "unknown",
  };
}
