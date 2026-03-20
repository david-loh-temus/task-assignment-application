// @ts-expect-error - GoogleGenAI is from an ESM package, imported dynamically at runtime
import type { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

import config from '../../config/config';
import logger from '../../lib/logger';
import { serviceUnavailable } from '../../shared/errors';

import { skillClassificationSystemPrompt } from './skill-classification.prompt';

const skillEntrySchema = z.object({
  name: z.string().trim().min(1, 'Skill name cannot be empty'),
  normalized_name: z.string().trim().min(1, 'Normalized skill name cannot be empty'),
  source: z.string().trim().min(1, 'Skill source cannot be empty'),
});
const skillEntryArraySchema = z.array(skillEntrySchema);

let geminiClient: GoogleGenAI | null = null;

/**
 * Singleton pattern for Gemini client initialization.
 * @returns A singleton instance of the Gemini client.
 * @throws SERVICE_UNAVAILABLE if the Gemini API key is not configured or if the
 * client fails to initialize.
 */
async function getGeminiClient(): Promise<GoogleGenAI> {
  if (!config.gemini.apiKey) {
    throw serviceUnavailable('Gemini API key is not configured');
  }

  if (!geminiClient) {
    // Use dynamic import for ESM compatibility
    const { GoogleGenAI } = await import('@google/genai');
    geminiClient = new GoogleGenAI({
      apiKey: config.gemini.apiKey,
    });
  }

  return geminiClient;
}

/**
 * Sanitizes user input for safe inclusion in LLM prompts.
 * @param input The raw user input to sanitize, such as a task title.
 * @returns A sanitized version of the input that is safe to include in the LLM prompt.
 * @remarks This function performs the following sanitization steps:
 * - Removes XML-like tags that could break the prompt structure.
 * - Collapses multiple newlines to prevent formatting manipulation.
 * - Removes common instruction keywords (even when joined to other words) to prevent prompt injection.
 * - Enforces a maximum length to prevent token limit issues.
 * - Trims leading and trailing whitespace.
 */
function sanitizePromptInput(input: string): string {
  const MAX_INPUT_LENGTH = 500;

  return (
    input
      // Remove XML-like tags that could break prompt structure
      .replace(/[<>{}]/g, '')
      // Remove common instruction keywords (case-insensitive, even when joined)
      .replace(/\b(instruction|ignore|system|assistant|user|prompt)\b/gi, '')
      // Again remove injected keywords that might have been concatenated after tag removal
      .replace(/ignore|instruction|system|assistant|user|prompt/gi, '')
      // Collapse multiple newlines
      .replace(/\n{2,}/g, '\n')
      // Enforce maximum length to prevent token limit issues
      .slice(0, MAX_INPUT_LENGTH)
      .trim()
  );
}

/**
 * Builds the user message for Gemini skill classification, including the
 * sanitized task title and existing skills.
 * @param taskTitle The title of the task for which to classify required skills.
 * @param existingSkillNamesJson A JSON string representing the list of existing
 * skill names to consider during classification.
 * @returns A formatted string to be used as the user message in the Gemini API
 * call, containing the task description and existing skills.
 */
function buildUserMessage(taskTitle: string, existingSkillNamesJson: string): string {
  const sanitizedTitle = sanitizePromptInput(taskTitle);

  return `
Task description:
<task_description>
${sanitizedTitle}
</task_description>

Existing skills:
<existing_skills_json>
${existingSkillNamesJson}
</existing_skills_json>

Return the required skills now.
  `;
}

/**
 * Parses the raw response from Gemini to extract the list of skill names.
 * @param rawResponse The raw text response from Gemini, expected to be a JSON
 * array of skill names.
 * @returns An array of skill names parsed from the Gemini response.
 * @throws SERVICE_UNAVAILABLE if the response is empty, not valid JSON, or does
 * not conform to the expected schema.
 */
export type AiSkillEntry = {
  name: string;
  normalizedName: string;
  source: string;
};

function parseSkillEntries(rawResponse: string | undefined): AiSkillEntry[] {
  if (!rawResponse) {
    throw serviceUnavailable('Gemini returned an empty skill classification response');
  }

  let parsedResponse: unknown;

  try {
    parsedResponse = JSON.parse(rawResponse);
  } catch {
    throw serviceUnavailable('Gemini returned an invalid skill classification response');
  }

  let parsedEntries: Array<{ name: string; normalized_name: string; source: string }>;

  try {
    parsedEntries = skillEntryArraySchema.parse(parsedResponse);
  } catch {
    throw serviceUnavailable('Gemini returned an invalid skill classification response');
  }

  const dedupedEntries = new Map<string, AiSkillEntry>();
  for (const entry of parsedEntries) {
    if (!dedupedEntries.has(entry.normalized_name)) {
      dedupedEntries.set(entry.normalized_name, {
        name: entry.name.trim(),
        normalizedName: entry.normalized_name.trim(),
        source: entry.source.trim(),
      });
    }
  }

  return [...dedupedEntries.values()];
}

/**
 * Classifies the required skills for a given task title using the Gemini API.
 * @param taskTitle The title of the task for which to classify required skills.
 * @param existingSkillNamesJson A JSON string representing the list of existing
 * skill names to consider during classification.
 * @returns An array of skill names classified as required for the task.
 */
export async function classifyTaskSkills(taskTitle: string, existingSkillNamesJson: string): Promise<AiSkillEntry[]> {
  const client = await getGeminiClient();
  const userMessage = buildUserMessage(taskTitle, existingSkillNamesJson);

  let responseText: string | undefined;

  try {
    const response = await client.models.generateContent({
      config: {
        responseMimeType: 'application/json',
        systemInstruction: skillClassificationSystemPrompt,
        // Temperature is set to 1.0 (default) per Gemini 3 recommendation.
        // Gemini docs strongly recommend keeping temperature at 1.0 with Gemini 3 models
        // to avoid unexpected behavior like looping or degraded performance.
        // See: https://ai.google.dev/gemini-api/docs/prompting-strategies#consistent-formatting
        temperature: 1.0,
      },
      contents: userMessage,
      model: config.gemini.model,
    });
    responseText = response.text;
  } catch (error) {
    logger.error(`Failed to classify task skills with Gemini with error: ${(error as Error).message}`);
    throw serviceUnavailable('Failed to generate required skills');
  }

  return parseSkillEntries(responseText);
}
