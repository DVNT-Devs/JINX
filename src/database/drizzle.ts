import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema";

const migrationClient = postgres(process.env["DATABASE_URL"] || "", { max: 1, database: "jinx" });

const DB: Promise<PostgresJsDatabase<typeof schema>> = (async () => {
    await migrate(drizzle(migrationClient, { schema }), { migrationsFolder: "./src/database/migration" });
    const queryClient = postgres(process.env["DATABASE_URL"] || "", { database: "jinx" });
    return drizzle(queryClient, { schema });
})();

export default DB;
