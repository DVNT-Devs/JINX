import { readFileSync } from "fs";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema";

const env = process.env;
let databaseUrl = "";
if (!env["DATABASE_USER"]) {
    databaseUrl = `postgresql://${env["DATABASE_HOST"]}`;
} else {
    const password = readFileSync(env["DATABASE_PASSWORD_FILE"]!, "utf-8");
    databaseUrl = `postgresql://${env["DATABASE_USER"]}:${password}@${env["DATABASE_HOST"]}`;
}

console.log(databaseUrl);
const migrationClient = postgres(databaseUrl, { max: 1, database: "jinx" });

const DB: Promise<PostgresJsDatabase<typeof schema>> = (async () => {
    await migrate(drizzle(migrationClient, { schema }), { migrationsFolder: "./src/database/migration" });
    const queryClient = postgres(databaseUrl, { database: "jinx" });
    return drizzle(queryClient, { schema });
})();

export default DB;
