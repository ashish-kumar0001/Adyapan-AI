import { getGeminiModel } from "./gemini";

// Helper for structured JSON output
async function parseGeminiJson(prompt: string, fallback: any = {}) {
  try {
    const model = getGeminiModel();
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    });
    const text = response.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini JSON Generation Error:", error);
    return fallback;
  }
}

export async function analyzeGithubProfile(username: string) {
  // In a real app we'd call the GitHub REST API here to fetch their repos.
  // We'll simulate that we pulled some data and ask Gemini to summarize their "developer identity".
  const aiPrompt = `
    You are an expert tech recruiter and developer advocate. 
    Analyze the GitHub identity of the user: "${username}". 
    
    Since you don't have real API access right now, generate a highly realistic, mocked developer profile analysis for this user based on common developer archetypes.

    You MUST return the output as a JSON object strictly matching this schema:
    {
      "summary": "A 2 sentence summary of what this developer specializes in.",
      "topLanguages": ["List", "of", "languages"],
      "estimatedCommits": 1200,
      "estimatedStars": 45,
      "keyProjects": [
        { "name": "AuthLib", "description": "A JWT authentication library" },
        { "name": "React-UI-Components", "description": "Accessible UI library" }
      ]
    }
  `;

  return parseGeminiJson(aiPrompt, {
    summary: "Failed to analyze profile.",
    topLanguages: [],
    estimatedCommits: 0,
    estimatedStars: 0,
    keyProjects: []
  });
}

export async function generateReadme(projectName: string, extraContext: string = "") {
  const aiPrompt = `
    You are an open-source maintainer. Write a professional, extremely detailed README.md file.
    
    Project Name: ${projectName}
    Additional Context: ${extraContext}

    Include badges, a beautiful header, installation steps, usage examples, and contributing guidelines.
    
    You MUST return the output as a JSON object strictly matching this schema:
    {
      "readmeContent": "The full markdown string of the README"
    }
  `;

  return parseGeminiJson(aiPrompt, {
    readmeContent: "# Error generating README"
  });
}

export async function generatePortfolio(profileData: string) {
  const aiPrompt = `
    You are an expert web designer. Based on this developer profile:
    ${profileData}

    Generate the content for a 3-page developer portfolio website.
    
    You MUST return the output as a JSON object strictly matching this schema:
    {
      "homeHero": {
        "tagline": "Catchy tagline",
        "bio": "Short bio"
      },
      "aboutSection": "A multi-paragraph professional background",
      "projectsToHighlight": [
        { "title": "Project 1", "tech": "React", "summary": "Did X" }
      ]
    }
  `;

  return parseGeminiJson(aiPrompt, {
    homeHero: { tagline: "Developer", bio: "Building things" },
    aboutSection: "Error generating about section",
    projectsToHighlight: []
  });
}
