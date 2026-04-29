import type { InorganicLibraryItem } from "./types";
import { INORGANIC_LIBRARY } from "./data";

export interface ReactionRule {
  reactants: string[]; // Array of library item IDs
  products: string[];  // Array of library item IDs
}

const REACTION_RULES: ReactionRule[] = [
  {
    // HCl + NaOH -> NaCl + H2O
    reactants: ["hcl", "naoh"],
    products: ["nacl", "water"],
  },
  {
    // Fe + S -> FeS (using sulfur and iron filings)
    reactants: ["iron", "sulfur"],
    products: ["sulfur"], // Simplification: in a real lab you'd get FeS, let's just show a change
  },
];

export function resolveReaction(contents: InorganicLibraryItem[]): InorganicLibraryItem[] {
  let currentContents = [...contents];
  let reacted = true;

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

        reacted = true;
        break; // Re-check all rules after a reaction occurs
      }
    }
  }

  return currentContents;
}
