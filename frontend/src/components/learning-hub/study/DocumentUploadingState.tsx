"use client";

import { motion } from "framer-motion";
import { AIThinkingScreen } from "@/components/ui/PremiumComponents";

const cleanStages = [
  "Uploading Document",
  "Extracting Text Content",
  "Analyzing Document Structure",
  "Identifying Main Topics",
  "Generating Detailed Summaries",
  "Creating Key Concepts",
  "Finalizing Topic Analysis",
  "Almost Ready"
];

function getStageIndex(stage: string): number {
  if (stage.includes("Uploading")) return 0;
  if (stage.includes("Extracting")) return 1;
  if (stage.includes("Analyzing")) return 2;
  if (stage.includes("Identifying")) return 3;
  if (stage.includes("Generating")) return 4;
  if (stage.includes("Creating")) return 5;
  if (stage.includes("Finalizing")) return 6;
  if (stage.includes("Almost")) return 7;
  return 0;
}

type Props = {
  c?: any;
  currentStage: string;
};

export function DocumentUploadingState({ currentStage }: Props) {
  const currentStep = getStageIndex(currentStage);

  return (
    <motion.div
      key="uploading"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-lg mx-auto py-8"
    >
      <AIThinkingScreen
        steps={cleanStages}
        currentStep={currentStep}
        title="Analyzing Uploaded Document..."
        subtitle="Extracting and index-mapping text boundaries"
      />
    </motion.div>
  );
}
