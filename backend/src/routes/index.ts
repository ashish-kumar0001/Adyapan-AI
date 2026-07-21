import { Router } from "express";
import { adminRouter } from "./admin.routes";
import { authRouter } from "./auth.routes";
import { healthRouter } from "./health.routes";
import { profileRouter } from "./profile.routes";
import { resumeRouter } from "./resume.routes";
import { atsRouter } from "./ats.routes";
import { resumeAnalysisRouter } from "./resume-analysis.routes";
import { coverLetterRouter } from "./cover-letter.routes";
import { linkedinRouter } from "./linkedin.routes";
import { studyRouter } from "./study.routes";
import { notesRouter } from "./notes.routes";
import { notesExportRouter } from "./notes-export.routes";
import { quizRouter } from "./quiz.routes";
import { assignmentRouter } from "./assignment.routes";
import { pptRouter } from "./ppt.routes";
import { mindMapRouter } from "./mindmap.routes";
import { codingRouter } from "./coding.routes";
import { dsaRouter } from "./dsa.routes";
import { challengesRouter } from "./challenges.routes";
import { githubRouter } from "./github.routes";
import { interviewRouter } from "./interview.routes";
import { adyChatRouter } from "./ady-chat.routes";
import { paymentRouter } from "./payment.routes";
import { notificationRouter } from "./notification.routes";
import { flashcardsRouter } from "./flashcards.routes";
import { analyticsRouter } from "./analytics.routes";
import { progressRouter } from "./progress.routes";
import { studyPlannerRouter } from "./study-planner.routes";
import { streakRouter } from "./streak.routes";
import { weakTopicsRouter } from "./weak-topics.routes";
import { recommendationRouter } from "./recommendation.routes";
import { researchRouter } from "./research.routes";
import { plagiarismRouter } from "./plagiarism.routes";
import { resumeUploadRouter } from "./resume-upload.routes";
import { jobRouter } from "./job.routes";
import { internshipRouter } from "./internship.routes";
import { jobListingRouter } from "./job-listing.routes";
import { communityRouter } from "./community.routes";
import { resumeImprovementRouter } from "./resume-improvement.routes";
import { careerRouter } from "./career.routes";
import { placementRouter } from "./placement.routes";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/profile", profileRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/resume", resumeRouter);
apiRouter.use("/resume-upload", resumeUploadRouter);
apiRouter.use("/ats", atsRouter);
apiRouter.use("/resume-analysis", resumeAnalysisRouter);
apiRouter.use("/cover-letter", coverLetterRouter);
apiRouter.use("/linkedin", linkedinRouter);

// Learning Hub Routes
apiRouter.use("/study", studyRouter);
apiRouter.use("/notes", notesRouter);
apiRouter.use("/notes/export", notesExportRouter);
apiRouter.use("/quiz", quizRouter);
apiRouter.use("/assignment", assignmentRouter);
apiRouter.use("/ppt", pptRouter);
apiRouter.use("/mindmap", mindMapRouter);
apiRouter.use("/coding", codingRouter);
apiRouter.use("/dsa", dsaRouter);
apiRouter.use("/challenges", challengesRouter);
apiRouter.use("/github", githubRouter);
apiRouter.use("/interview", interviewRouter);
apiRouter.use("/ady-chat", adyChatRouter);
apiRouter.use("/flashcards", flashcardsRouter);
apiRouter.use("/payment", paymentRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/analytics", analyticsRouter);
apiRouter.use("/progress", progressRouter);
apiRouter.use("/study-planner", studyPlannerRouter);
apiRouter.use("/streak", streakRouter);
apiRouter.use("/weak-topics", weakTopicsRouter);
apiRouter.use("/recommendations", recommendationRouter);

// Research Hub Routes
apiRouter.use("/research", researchRouter);

// Plagiarism Checker Routes
apiRouter.use("/plagiarism", plagiarismRouter);

// Job Hub Routes
apiRouter.use("/job", jobRouter);

// Internship Hub Routes
apiRouter.use("/internship", internshipRouter);

// Enhanced Job Listing Routes
apiRouter.use("/job-listing", jobListingRouter);

// Community Routes
apiRouter.use("/community", communityRouter);

// Resume Improvement Engine Routes
apiRouter.use("/resume-improvements", resumeImprovementRouter);

// Career Navigation Engine Routes
apiRouter.use("/career", careerRouter);

// Placement Hub Routes
apiRouter.use("/placement", placementRouter);




