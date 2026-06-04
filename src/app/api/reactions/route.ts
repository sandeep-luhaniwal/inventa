import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { reactants } = await request.json();
    const apiKey = process.env.AI_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "AI_KEY is not configured in .env file" },
        { status: 500 }
      );
    }

    // Call OpenAI Chat Completions API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a professional chemistry simulation assistant. You are simulating mixing chemicals in a beaker.
Input is a list of reactant items with their name, symbol/formula, and state.
Analyze the mixture. If a chemical reaction occurs, determine the products (their formulas, names, and states) and describe the observation/reaction equation.
If no reaction occurs (e.g. they don't react, or just dissolve without a chemical reaction), return the same reactants as the products, and note "No reaction occurs."

You MUST return a JSON object with this exact structure:
{
  "products": [
    {
      "id": "string",
      "module": "inorganic",
      "category": "solids" | "liquids" | "gases",
      "name": "string",
      "symbol": "string", // pure chemical formula only (e.g., "NaCl", "H2O", "Na2O2"). Do NOT include any "+" signs, reaction operators, or equations.
      "state": "solid" | "liquid" | "gas",
      "accent": "string", // hex color representing the visual color of the product (e.g., "#38bdf8", "#94a3b8", etc.)
      "description": "string",
      "volume": number, // optional, in mL (only if liquid or gas)
      "mass": number // optional, in grams (only if solid)
    }
  ],
  "state": "burst" | "gas" | "precipitate" | "reduction" | "idle", // burst (explosion/violent reaction), gas (gas bubbles/smoke), precipitate (color change or solid precipitate), reduction (metal coating/displacement), idle (no reaction)
  "note": "string" // concise chemical equation (e.g., "Fe + CuSO4 -> FeSO4 + Cu") followed by a brief 1-2 sentence description of the observation or result.
}`
          },
          {
            role: "user",
            content: `Simulate the mixing of these reactants: ${JSON.stringify(reactants)}`
          }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "OpenAI API Error" },
        { status: response.status }
      );
    }

    const result = JSON.parse(data.choices[0].message.content);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
