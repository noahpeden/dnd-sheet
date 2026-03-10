import { action } from "./_generated/server";
import { v } from "convex/values";

export const parseCharacterSheet = action({
  args: { pdfText: v.string() },
  handler: async (_ctx, { pdfText }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const systemPrompt = `You are a character sheet parser for a custom tabletop RPG system.
Extract character information from the provided text and return ONLY a valid JSON object.
Do not include any explanation, markdown, or extra text — just the raw JSON object.

The JSON must follow this exact structure (use null or empty values when data is not found):
{
  "info": {
    "name": "",
    "player": "",
    "race": "",
    "class_": "",
    "level": 1,
    "alignment": "",
    "age": "",
    "height": "",
    "weight": "",
    "sex": ""
  },
  "hp": { "max": 0, "current": 0, "temp": 0 },
  "currency": { "cp": 0, "sp": 0, "gp": 0, "pp": 0, "cr": 0 },
  "charNotes": "",
  "skills": {},
  "inventory": []
}

For "skills", if skill values are found, use the format:
{ "SkillName": { "base": 0, "bonus": "", "temp": 0, "tempNote": "" } }

For "inventory", if items are found, use the format:
{ "id": "imp_<random>", "name": "", "stats": "", "notes": "", "category": "misc", "bonuses": {}, "bonusNotes": {}, "ecCap": 0, "enchantments": [] }

Set "level" as a number. Set all currency values as numbers. Leave skills empty ({}) if none found.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Parse this character sheet and return the JSON:\n\n${pdfText.slice(0, 15000)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "";

    // Strip markdown code fences if present
    const clean = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim();

    try {
      return JSON.parse(clean);
    } catch {
      throw new Error("Failed to parse Claude response as JSON: " + text.slice(0, 200));
    }
  },
});
