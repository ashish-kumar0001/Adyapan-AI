import { generateJSON, MODELS } from "./openrouter";

const GITHUB_SYSTEM = "You are an expert tech recruiter and developer advocate specializing in GitHub profile analysis.";

export async function analyzeGithubProfile(username: string) {
  return generateJSON(
    GITHUB_SYSTEM,
    `Analyze the GitHub profile of developer: "${username}".
Generate a realistic profile analysis based on the developer's actual activity and contributions.

Return JSON matching:
{
  "summary": "2 sentence summary of what this developer specializes in",
  "topLanguages": ["list", "of", "languages"],
  "estimatedCommits": 1200,
  "estimatedStars": 45,
  "keyProjects": [
    { "name": "ProjectName", "description": "Brief description" }
  ]
}`,
    { model: MODELS.FAST },
    {
      summary: "Failed to analyze profile.",
      topLanguages: [],
      estimatedCommits: 0,
      estimatedStars: 0,
      keyProjects: [],
    }
  );
}

export async function generateReadme(projectName: string, extraContext: string = "") {
  return generateJSON(
    GITHUB_SYSTEM,
    `Write a professional, detailed README.md for project: "${projectName}"
Context: ${extraContext}

Include badges, beautiful header, installation steps, usage examples, contributing guidelines.

Return JSON matching:
{
  "readmeContent": "Full markdown string of the README"
}`,
    { model: MODELS.BALANCED },
    { readmeContent: "# Error generating README" }
  );
}

export async function generatePortfolio(profileData: string) {
  return generateJSON(
    GITHUB_SYSTEM,
    `Based on this developer profile, generate content for a 3-page portfolio website.

Profile:
${profileData}

Return JSON matching:
{
  "homeHero": {
    "tagline": "Catchy tagline",
    "bio": "Short bio"
  },
  "aboutSection": "Multi-paragraph professional background",
  "projectsToHighlight": [
    { "title": "Project 1", "tech": "React", "summary": "Did X" }
  ]
}`,
    { model: MODELS.BALANCED },
    {
      homeHero: { tagline: "Developer", bio: "Building things" },
      aboutSection: "Error generating about section",
      projectsToHighlight: [],
    }
  );
}
