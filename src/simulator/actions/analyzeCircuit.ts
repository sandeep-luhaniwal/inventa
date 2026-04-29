"use server"

import type { PlacedComponent, Wire } from "../types/circuit";
import { simulateCircuit } from "../utils/simulation";

type VisualState = {
  lit: boolean;
  powered: boolean;
  direction?: number;
  brightness?: number;
  isBurned?: boolean;
};

type AnalysisResult = {
  status: "Correct" | "Wrong";
  reason: string;
  visualStates?: Record<string, VisualState>;
};

export async function analyzeCircuit(
  components: PlacedComponent[],
  wires: Wire[],
  staticDefs: any[]
): Promise<AnalysisResult> {
  const apiKey = "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";
  
  if (!apiKey) {
    return {
      status: "Wrong",
      reason: "OpenAI API key is missing. Please add it to your .env file.",
    };
  }

  // Pre-process topology for AI
  const componentInfo = components.map(c => {
    const def = staticDefs.find((d: any) => d.id === c.componentId);
    return {
      id: c.id,
      type: c.componentId,
      name: def?.name || c.componentId,
      pins: def?.relativePins || [],
      properties: {
        resistanceValue: c.resistanceValue,
        resistanceUnit: c.resistanceUnit,
        voltageValue: c.voltageValue,
        capacitanceValue: c.capacitanceValue,
        capacitanceUnit: c.capacitanceUnit,
      },
      ledColor: c.ledColor
    };
  });

  // Calculate connections (wires + overlapping pins)
  const allPins: { x: number; y: number; compId: string; portIndex: number }[] = [];
  components.forEach(c => {
    c.ports?.forEach((p, i) => {
      allPins.push({ x: c.x + p.x, y: c.y + p.y, compId: c.id, portIndex: i });
    });
  });

  const connections = wires.map(w => ({ from: w.from, to: w.to }));
  
  // Add pin-to-pin overlaps (Magnetic Snapping / Direct placement)
  for (let i = 0; i < allPins.length; i++) {
    for (let j = i + 1; j < allPins.length; j++) {
      const p1 = allPins[i];
      const p2 = allPins[j];
      if (p1.compId === p2.compId) continue;
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (dist < 10) { 
        connections.push({
          from: { compId: p1.compId, portIndex: p1.portIndex },
          to: { compId: p2.compId, portIndex: p2.portIndex }
        });
      }
    }
  }

  // Add Internal Component Bridges (e.g. Breadboard rows, Switch internal paths)
  components.forEach(c => {
    const def = staticDefs.find((d: any) => d.id === c.componentId);
    if (!def) return;

    // Breadboard logic: Pins with same 'type' are connected internally
    if (c.componentId === "breadboard" && def.relativePins) {
      const groups = new Map<string, number[]>();
      def.relativePins.forEach((pin: any, index: number) => {
        if (!pin.type) return;
        const entries = groups.get(pin.type) ?? [];
        entries.push(index);
        groups.set(pin.type, entries);
      });
      for (const indexes of groups.values()) {
        for (let i = 1; i < indexes.length; i++) {
          connections.push({
            from: { compId: c.id, portIndex: indexes[0] },
            to: { compId: c.id, portIndex: indexes[i] }
          });
        }
      }
    }

    // Switches: Assume they are closed for simulation unless properties say otherwise
    // Or just let the AI decide based on properties.
  });

  const prompt = `
Analyze this circuit topology and return a JSON object.

Components:
${JSON.stringify(componentInfo, null, 2)}

Electrical Connections:
${JSON.stringify(connections, null, 2)}

Simulation Rules:
1. Trace current from Power Sources (Batteries).
2. For an LED/Bulb to be "lit", it must be in a complete path from (+) to (-).
3. For a Motor to "rotate", it must be in a complete path. Use "lit": true to trigger rotation.
4. "direction": 1 (CW) if Battery(+) hits Motor(+). -1 (CCW) if Battery(+) hits Motor(-).
5. "isBurned": true if 9V is connected to an LED without a resistor.

Output JSON Format:
{
  "status": "Correct" | "Wrong",
  "reason": "short explanation",
  "visualStates": {
    "COMPONENT_ID": {
      "lit": true,
      "powered": true,
      "direction": 1,
      "brightness": 1.0,
      "isBurned": false
    }
  }
}
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert electronics engineer and circuit simulator. Analyze the circuit topology and respond with JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0]) {
      throw new Error("AI failed to respond.");
    }
    const result = JSON.parse(data.choices[0].message.content);

    return {
      status: result.status,
      reason: result.reason,
      visualStates: result.visualStates
    };
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return {
      status: "Wrong",
      reason: "Simulation Error: " + (error.message || "Failed to analyze circuit with AI."),
    };
  }
}
