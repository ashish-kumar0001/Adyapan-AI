import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "schema.user.prisma",
  datasource: {
    url: process.env["USER_DATABASE_URL"] ?? "",
  },
});
