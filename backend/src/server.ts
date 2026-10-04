import { createApp } from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

/** Entry point: connect to MongoDB first, then start accepting requests. */
async function bootstrap() {
  await connectDB();

  // Listen on all interfaces so a phone / emulator on the LAN can reach the API.
  createApp().listen(env.port, "0.0.0.0", () => {
    console.log(
      `[api] TaskFlow API running on http://localhost:${env.port}/api`,
    );
  });
}

bootstrap().catch((err) => {
  console.error("[api] Failed to start:", err);
  process.exit(1);
});
