"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AIThinkingScreen, ErrorState } from "@/components/ui/PremiumComponents";
import { mkColors } from "@/utils/themeColors";

const loadingSteps = [
  "Analyzing Topic Semantics",
  "Building Custom Learning Path",
  "Creating Real-World Analogies",
  "Generating Comprehension Checkpoint Quiz",
  "Finalizing Visual Revision Sheet"
];

type Props = {
  c: ReturnType<typeof mkColors>;
  loadingStep: number;
  topicError: string | null;
  isGenerating: boolean;
};

export function LessonLoadingState({ c, loadingStep, topicError, isGenerating }: Props) {
  return (
    <>
      <AnimatePresence mode="wait">
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="mb-6 w-full"
          >
            <AIThinkingScreen
              steps={loadingSteps}
              currentStep={loadingStep}
              title="Generating Personalized Lesson..."
              subtitle="Synthesizing topic boundaries via AI model"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {topicError && (
        <div className="mb-6 w-full">
          <ErrorState
            title="Lesson Generation Failed"
            description={topicError}
          />
        </div>
      )}
    </>
  );
}
