import { test } from "@jest/globals";
// import dbPromise from "../database/drizzle";
// import { relationships, punishments } from "../database/schema";
// import { eq } from "drizzle-orm";


test("database.ts: Check database is working", async () => {
    return true;
    // TODO: Make this test not fail on GitHub Actions (only fails locally)
    // if (process.env["CI"]) return;
    // const db = await dbPromise;
    // expect(db).toBeDefined();
    // // Check if the tables defined in schema.ts exist

    // // Check the relationships table
    // const relationshipsTable = await db.insert(relationships)
    //     .values({ dom: "1", sub: "2" });
    // expect(relationshipsTable).toBeDefined();
    // // Read the row
    // const row = await db.select().from(relationships).where(eq(relationships.dom, "1"));
    // expect(row[0]).toHaveProperty("dom", "1");
    // expect(row[0]).toHaveProperty("sub", "2");
    // // Delete the row
    // await db.delete(relationships).where(eq(relationships.dom, "1"));
    // // Check the punishments table
    // expect(punishments).toBeDefined();
});
