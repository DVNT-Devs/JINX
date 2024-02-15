import { readFileSync } from "fs";
import type { Config } from "drizzle-kit";

const env = process.env;
let databaseUrl = "";
if (!env["DATABASE_USER"]) {
    databaseUrl = `postgresql://${env["DATABASE_HOST"]}`;
} else {
    const password = readFileSync(env["DATABASE_PASSWORD_FILE"]!, "utf-8");
    databaseUrl = `postgresql://${env["DATABASE_USER"]}:${password}@${env["DATABASE_HOST"]}`;
}
export { databaseUrl };

export default {
    schema: "./src/database/schema.ts",
    driver: "pg",
    out: "src/database/migration",
    dbCredentials: {
        connectionString: databaseUrl || ""
    }
} satisfies Config;
