import type { InorganicLibraryItem } from "./types";
import { INORGANIC_LIBRARY } from "./data";

export interface ReactionRule {
  reactants: string[]; // Array of library item IDs
  products: string[];  // Array of library item IDs
  state?: "burst" | "gas" | "precipitate" | "reduction";
  note?: string;
}

const REACTION_RULES: ReactionRule[] = [
  {
    reactants: ["sodium", "water"],
    products: ["nacl-solution"],
    state: "burst",
    note: "Sodium reacts violently with water in this simulation.",
  },
  {
    reactants: ["iron", "cuso4-solution"],
    products: ["cuso4-solution"],
    state: "precipitate",
    note: "Iron displaces copper from copper sulfate; copper coats the iron.",
  },
];

export interface ReactionResult {
  contents: InorganicLibraryItem[];
  state?: ReactionRule["state"];
  note?: string;
}

export function resolveReaction(contents: InorganicLibraryItem[]): ReactionResult {
  const currentContents = [...contents];
  let reacted = true;
  let reactionState: ReactionRule["state"];
  let reactionNote: string | undefined;

  while (reacted) {
    reacted = false;
    for (const rule of REACTION_RULES) {
      const hasAllReactants = rule.reactants.every((rId) =>
        currentContents.some((item) => item.id === rId)
      );

      if (hasAllReactants) {
        // Consume reactants
        rule.reactants.forEach((rId) => {
          const index = currentContents.findIndex((item) => item.id === rId);
          if (index !== -1) currentContents.splice(index, 1);
        });

        // Produce products
        rule.products.forEach((pId) => {
          const product = INORGANIC_LIBRARY.find((item) => item.id === pId);
          if (product) currentContents.push(product);
        });

        reactionState = rule.state;
        reactionNote = rule.note;
        reacted = true;
        break; // Re-check all rules after a reaction occurs
      }
    }
  }

  return { contents: currentContents, state: reactionState, note: reactionNote };
}
