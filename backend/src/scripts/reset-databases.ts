import { execSync } from "child_process";
import { databaseService } from "../services/database.service";

async function resetAllDatabases() {
  console.log("=== STARTING COMPLETE DATABASE RESET ===");

  try {
    // 1. Fetch all databases from Neon
    console.log("Fetching databases from Neon...");
    const databases = await databaseService.listDatabases();
    const userDbs = databases.filter((db) => db.name.startsWith("user_"));

    console.log(`Found ${userDbs.length} user databases to delete.`);

    // 2. Delete each user database
    for (const db of userDbs) {
      console.log(`Deleting user database: ${db.name} (ID: ${db.id})...`);
      try {
        await databaseService.deleteDatabase(db.id);
        console.log(`Successfully deleted ${db.name}`);
      } catch (err: any) {
        console.error(`Failed to delete user database ${db.name}:`, err.message || err);
      }
    }

    // 3. Reset the master database
    console.log("Resetting master database...");
    execSync("npx prisma db push --force-reset", { cwd: process.cwd(), stdio: "inherit" });
    console.log("Master database reset successfully.");

    // 4. Push user schema to master database (required for fallback/shared database setups)
    console.log("Pushing user schema to master database...");
    execSync("npx prisma db push --schema=prisma/schema.user.prisma --accept-data-loss", { cwd: process.cwd(), stdio: "inherit" });
    console.log("User schema pushed to master database successfully.");

    console.log("=== DATABASE RESET COMPLETE ===");
  } catch (error: any) {
    console.error("Critical error during database reset:", error.message || error);
    process.exit(1);
  }
}

resetAllDatabases();
