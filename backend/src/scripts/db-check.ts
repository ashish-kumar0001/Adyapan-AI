import "dotenv/config";
import { prisma } from "../config/prisma";
import { databaseService } from "../services/database.service";
import { createPrismaClient } from "../config/dynamicPrisma";

async function main() {
  console.log("[DB Audit] Starting global database integrity check...");

  try {
    // 1. Audit Master database users
    const users = await prisma.user.findMany();
    console.log(`[DB Audit] Found ${users.length} users in master database.`);

    for (const user of users) {
      console.log(`\n[DB Audit] Auditing user ${user.name} (ID: ${user.id})...`);
      
      if (!user.email || !user.name) {
        console.warn(`[WARNING] User ${user.id} has missing email or name.`);
      }

      try {
        const dbUrl = await databaseService.getDatabaseUrlForUser(user.id);
        const userPrisma = createPrismaClient(dbUrl);

        // Audit profile
        const profile = await userPrisma.profile.findUnique({ where: { userId: user.id } });
        if (!profile) {
          console.warn(`[WARNING] User ${user.id} has no profile record.`);
        }

        // Audit uploaded documents
        const docs = await userPrisma.uploadedDocument.findMany();
        console.log(`[DB Audit] User has ${docs.length} uploaded documents.`);
        for (const doc of docs) {
          if (!doc.fileName || !doc.fileUrl) {
            console.warn(`[WARNING] Document ${doc.id} is missing fileName or fileUrl.`);
          }
          if (doc.sessionId) {
            const session = await userPrisma.studySession.findUnique({ where: { id: doc.sessionId } });
            if (!session) {
              console.warn(`[ORPHANED] Document ${doc.id} references non-existent study session ${doc.sessionId}.`);
            }
          }
        }

        // Audit study sessions
        const sessions = await userPrisma.studySession.findMany();
        console.log(`[DB Audit] User has ${sessions.length} study sessions.`);

        // Audit resumes
        const resumes = await userPrisma.resume.findMany();
        console.log(`[DB Audit] User has ${resumes.length} resumes.`);
        for (const res of resumes) {
          const checkJson = (field: any, name: string) => {
            if (field === null || typeof field !== "object") {
              console.warn(`[CORRUPTED JSON] Resume ${res.id} has invalid or null ${name} field.`);
            }
          };
          checkJson(res.personalInfo, "personalInfo");
          checkJson(res.education, "education");
          checkJson(res.experience, "experience");
          checkJson(res.projects, "projects");
          checkJson(res.skills, "skills");
        }

        // Audit and clamp streak logs and counters
        const streaks = await userPrisma.learningStreak.findMany();
        for (const str of streaks) {
          if (str.currentStreak < 0 || str.longestStreak < 0 || str.points < 0) {
            console.warn(`[NEGATIVE VALUE] Streak counter for user ${user.id} is negative: streak=${str.currentStreak}, points=${str.points}. Clamping to 0.`);
            await userPrisma.learningStreak.update({
              where: { id: str.id },
              data: {
                currentStreak: Math.max(0, str.currentStreak),
                longestStreak: Math.max(0, str.longestStreak),
                points: Math.max(0, str.points),
              }
            });
          }
        }

        // Audit and clamp progress metrics
        const progress = await userPrisma.dsaProgress.findMany();
        for (const prog of progress) {
          if (prog.solved < 0 || prog.accuracy < 0 || prog.accuracy > 100 || prog.streak < 0) {
            console.warn(`[OUT OF RANGE] DSA progress values out of bounds for user ${user.id}: solved=${prog.solved}, accuracy=${prog.accuracy}, streak=${prog.streak}. Clamping...`);
            await userPrisma.dsaProgress.update({
              where: { id: prog.id },
              data: {
                solved: Math.max(0, prog.solved),
                accuracy: Math.max(0, Math.min(100, prog.accuracy)),
                streak: Math.max(0, prog.streak),
              }
            });
          }
        }

        // Audit weak topics metrics
        const weakTopics = await userPrisma.weakTopic.findMany();
        for (const topic of weakTopics) {
          if (topic.strengthScore < 0 || topic.strengthScore > 100 || topic.questionAccuracy < 0 || topic.questionAccuracy > 100) {
            console.warn(`[OUT OF RANGE] Weak topic values out of bounds for user ${user.id} (${topic.topicName}): score=${topic.strengthScore}, accuracy=${topic.questionAccuracy}. Clamping...`);
            await userPrisma.weakTopic.update({
              where: { id: topic.id },
              data: {
                strengthScore: Math.max(0, Math.min(100, topic.strengthScore)),
                questionAccuracy: Math.max(0, Math.min(100, topic.questionAccuracy)),
              }
            });
          }
        }

        await userPrisma.$disconnect();
      } catch (err: any) {
        console.error(`[ERROR] Failed to audit database for user ${user.id}:`, err.message || err);
      }
    }
  } catch (masterErr: any) {
    console.error(`[ERROR] Failed to query master database:`, masterErr.message || masterErr);
  }

  console.log("\n[DB Audit] Global database integrity audit completed successfully.");
}

main().catch(console.error);
