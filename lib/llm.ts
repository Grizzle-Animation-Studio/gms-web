/**
 * LLM API Client for LM Studio
 * Provides OpenAI-compatible API interface to local LLM
 */

export interface ParsedDeliverable {
    name: string;           // e.g., "Hero Video", "Social Cut"
    aspectRatio: string;    // e.g., "16:9", "9:16"
    duration: string;       // e.g., "30s", "60s", "2min"
    description: string;    // Brief description of this specific deliverable
}

export interface ParsedEnquiry {
    // Company Information
    clientName: string;
    companyWebsite: string | null;  // Inferred from email domain or mentioned in content

    // Individual Contact (if mentioned)
    contactFirstName: string | null;
    contactLastName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    contactJobTitle: string | null;

    // Project Information
    projectTitle: string;
    projectSummary: string;  // Short 1-2 sentence overview
    projectDescription: string;  // Detailed description
    budget: string | null;
    timeline: string | null;

    // Job Details - Technical Specifications
    framerate: string | null;  // Default framerate if not specified per deliverable
    tone: string | null;
    referenceLinks: string[];  // Array of extracted URLs

    // Deliverables - array with individual specs
    deliverables: ParsedDeliverable[];

    // Legacy fields for backward compatibility
    aspectRatio: string | null;
    numberOfDeliverables: number | null;
}

const LLM_API_URL = process.env.LLM_API_URL || "http://localhost:1234/v1";
const LLM_MODEL = process.env.LLM_MODEL || "qwen/qwen2.5-32b-instruct";
const LLM_API_KEY = process.env.LLM_API_KEY || "";  // For cloud providers (OpenAI, Groq)

/**
 * Parse raw enquiry text using local LLM
 */
export async function parseEnquiryWithLLM(rawContent: string): Promise<ParsedEnquiry> {
    const systemPrompt = `You are an assistant that extracts structured information from project enquiry emails.
Extract the following information and return ONLY valid JSON with these exact fields:

Company Information:
- clientName: The company or organization name
- companyWebsite: Infer the company website URL. Use these strategies in order:
  1. If a website URL is explicitly mentioned in the content, use that
  2. If an email domain is present (e.g. sarah@acme.com), convert to www.acme.com
  3. If only company name is known, make a reasonable guess (e.g. "Acme Corp" -> www.acmecorp.com)
  Return the URL with www. prefix (e.g. "www.example.com"), or null if cannot be reasonably inferred.

Individual Contact (if a person is mentioned):
- contactFirstName: Person's first name (null if not mentioned)
- contactLastName: Person's last name (null if not mentioned)  
- contactEmail: Email address (null if not mentioned)
- contactPhone: Phone number (null if not mentioned)
- contactJobTitle: Their job title or role (null if not mentioned)

Project Information:
- projectTitle: A professional project title (max 50 characters)
- projectSummary: A brief 1-2 sentence overview of what they want
- projectDescription: A comprehensive detailed description capturing all salient project details, requirements, and context. Extract as much relevant information as needed to fully understand the project scope and deliverables.
- budget: Budget amount with currency (null if not mentioned, keep original format)
- timeline: Deadline or timeframe (null if not mentioned)

Job Details - Technical Specifications:
- framerate: Default video framerate if mentioned (e.g., "24fps", "30fps", "60fps", null if not mentioned)
- tone: Creative tone or style (e.g., "Corporate", "Energetic", "Minimal", "Fun", null if not mentioned)
- deliverables: An array of individual deliverables. For EACH video/output mentioned, create an object with:
  - name: Descriptive name (e.g., "Hero Video", "Social Portrait Cut", "Product Demo")
  - aspectRatio: Format like "16:9", "9:16", "1:1" etc.
  - duration: Length like "30s", "60s", "2min" etc.
  - description: Brief description of what this specific deliverable is for
  
  IMPORTANT: If the client mentions multiple videos with DIFFERENT specs (e.g., "one 16:9 and one 9:16"), 
  create SEPARATE deliverable objects for each. Don't combine aspect ratios.
  
  Example: "2 videos, both 30s, one 16:9 and one 9:16" should become:
  [{ "name": "Landscape Version", "aspectRatio": "16:9", "duration": "30s", "description": "Landscape format video" },
   { "name": "Portrait Version", "aspectRatio": "9:16", "duration": "30s", "description": "Portrait format video" }]

Important: Return ONLY the JSON object, no other text or explanation.
Examples of job titles: "Marketing Manager", "CEO", "Project Lead", "Owner"`;

    const userPrompt = `Extract information from this enquiry:\n\n${rawContent}`;

    // Extract URLs from raw content
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const extractedUrls = rawContent.match(urlRegex) || [];

    try {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        // Add auth header for cloud providers (OpenAI, Groq, etc.)
        if (LLM_API_KEY) {
            headers["Authorization"] = `Bearer ${LLM_API_KEY}`;
        }

        const response = await fetch(`${LLM_API_URL}/chat/completions`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                model: LLM_MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                temperature: 0.3, // Lower temperature for more consistent extraction
                max_tokens: 700,  // Increased for additional fields
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`LLM API returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            throw new Error("No content in LLM response");
        }

        // Try to extract JSON from response (in case LLM added extra text)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : content;

        const parsed: any = JSON.parse(jsonStr);

        // Log the raw response for debugging
        console.log("LLM returned:", parsed);

        // Handle both nested (Qwen format) and flat formats
        const companyInfo = parsed['Company Information'] || parsed;
        const contactInfo = parsed['Individual Contact'] || parsed;
        const projectInfo = parsed['Project Information'] || parsed;
        const jobDetails = parsed['Job Details - Technical Specifications'] || parsed;

        const result: ParsedEnquiry = {
            // Company info - try nested first, then flat
            clientName: companyInfo.clientName || parsed.clientName || "",
            companyWebsite: companyInfo.companyWebsite || parsed.companyWebsite || null,

            // Contact info - try nested first, then flat
            contactFirstName: contactInfo.contactFirstName || parsed.contactFirstName || null,
            contactLastName: contactInfo.contactLastName || parsed.contactLastName || null,
            contactEmail: contactInfo.contactEmail || parsed.contactEmail || null,
            contactPhone: contactInfo.contactPhone || parsed.contactPhone || null,
            contactJobTitle: contactInfo.contactJobTitle || parsed.contactJobTitle || null,

            // Project info - try nested first, then flat, then old field names
            projectTitle: projectInfo.projectTitle || parsed.projectTitle || parsed.suggestedTitle || "",
            projectSummary: projectInfo.projectSummary || parsed.projectSummary || "",
            projectDescription: projectInfo.projectDescription || parsed.projectDescription || parsed.projectType || "",
            budget: projectInfo.budget || parsed.budget || null,
            timeline: projectInfo.timeline || parsed.timeline || null,

            // Job details - new fields
            framerate: jobDetails.framerate || parsed.framerate || null,
            tone: jobDetails.tone || parsed.tone || null,

            // Deliverables array with individual specs
            deliverables: Array.isArray(jobDetails.deliverables)
                ? jobDetails.deliverables
                : Array.isArray(parsed.deliverables)
                    ? parsed.deliverables
                    : [],

            // Legacy fields for backward compatibility
            aspectRatio: jobDetails.aspectRatio || parsed.aspectRatio || null,
            numberOfDeliverables: jobDetails.numberOfDeliverables || parsed.numberOfDeliverables || null,

            // Extracted URLs
            referenceLinks: extractedUrls,
        };

        console.log('🔍 Parsed enquiry result:', result);
        if (extractedUrls.length > 0) {
            console.log(`📎 Extracted ${extractedUrls.length} reference link(s)`);
        }

        // Validate required fields - only company name is truly required
        if (!result.clientName) {
            console.error("Missing company name in LLM response:", result);
            console.error("Parsed from:", parsed);
            throw new Error(`LLM response missing company name. Got: clientName="${result.clientName}"`);
        }

        return result;
    } catch (error) {
        console.error("Failed to parse enquiry with LLM:", error);
        throw error;
    }
}

/**
 * Check if LLM API is available
 */
export async function checkLLMAvailability(): Promise<boolean> {
    try {
        const response = await fetch(`${LLM_API_URL}/models`, {
            method: "GET",
            signal: AbortSignal.timeout(3000), // 3 second timeout
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}
