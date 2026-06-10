import type { InorganicLibraryItem } from "./types";
import { INORGANIC_LIBRARY } from "./data";

export interface ReactionRule {
  reactants: string[]; // Array of library item IDs
  products: string[];  // Array of library item IDs
  state?: "burst" | "gas" | "precipitate" | "reduction" | "idle";
  note?: string;
}

export const REACTION_RULES: ReactionRule[] = [
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
  {
    reactants: ["oxygen", "nitrogen"],
    products: ["air"],
    state: "idle",
    note: "O2 + N2 -> Air. The molecules of both gases spread uniformly into the empty spaces between each other without undergoing any chemical reaction. The gases mix completely through diffusion, and no bubbles, precipitate, or visible change will be observed.",
  },
  {
    reactants: ["oxygen-gasbag", "nitrogen"],
    products: ["air"],
    state: "idle",
    note: "O2 + N2 -> Air. The molecules of both gases spread uniformly into the empty spaces between each other without undergoing any chemical reaction. The gases mix completely through diffusion, and no bubbles, precipitate, or visible change will be observed.",
  },
  {
    reactants: ["oxygen", "nitrogen-gasbag"],
    products: ["air"],
    state: "idle",
    note: "O2 + N2 -> Air. The molecules of both gases spread uniformly into the empty spaces between each other without undergoing any chemical reaction. The gases mix completely through diffusion, and no bubbles, precipitate, or visible change will be observed.",
  },
  {
    reactants: ["oxygen-gasbag", "nitrogen-gasbag"],
    products: ["air"],
    state: "idle",
    note: "O2 + N2 -> Air. The molecules of both gases spread uniformly into the empty spaces between each other without undergoing any chemical reaction. The gases mix completely through diffusion, and no bubbles, precipitate, or visible change will be observed.",
  },
  {
    reactants: ["chloroform", "nitrogen"],
    products: ["chloroform-vapor"],
    state: "gas",
    note: "Chloroform vaporizes in nitrogen gas."
  },
  {
    reactants: ["chloroform", "nitrogen-gasbag"],
    products: ["chloroform-vapor"],
    state: "gas",
    note: "Chloroform vaporizes in nitrogen gas."
  },
  {
    reactants: ["water", "air"],
    products: ["mist"],
    state: "gas",
    note: "Water vaporizes in air to form mist."
  },
  {
    reactants: ["water", "air-filled-gasbag"],
    products: ["mist"],
    state: "gas",
    note: "Water vaporizes in air to form mist."
  },
  {
    reactants: ["ethanol", "water"],
    products: ["ethanol-solution"],
    state: "idle",
    note: "Ethanol (C2H5OH) and Water (H2O) mix completely because of their compatible polar properties (hydrogen bonding), forming a uniform single-phase solution. No new chemical bonds are formed, and no separate layers or bubbles are produced."
  },
  {
    reactants: ["hydrogen", "palladium-plate"],
    products: ["palladium-adsorbed"],
    state: "idle",
    note: "H2 (g) + Pd (s) -> Pd-H (adsorbed). Hydrogen gas molecules are adsorbed onto the surface and within the pores of the palladium plate."
  },
  {
    reactants: ["mercury", "sodium"],
    products: ["sodium-amalgam"],
    state: "idle",
    note: "Na (s) + Hg (l) -> Na-Hg (amalgam). The solid sodium completely absorbs the liquid mercury, forming a uniform semi-solid amalgam paste."
  },
  {
    reactants: ["gold-powder", "copper-powder"],
    products: ["gold-copper-alloy"],
    state: "idle",
    note: "Au (s) + Cu (s) -> Au-Cu (alloy). The gold and copper metals are melted at high temperature and integrate into a single crystal structure, forming a homogeneous alloy upon cooling."
  },
];

export interface ReactionResult {
  contents: InorganicLibraryItem[];
  state?: ReactionRule["state"];
  note?: string;
}

export function resolveReaction(contents: InorganicLibraryItem[], vesselId?: string, hasGloves?: boolean, isHeated?: boolean): ReactionResult {
  const currentContents = [...contents];
  let reacted = true;
  let reactionState: ReactionRule["state"];
  let reactionNote: string | undefined;

  // Custom check for Gas dissolution (Aerated Liquid)
  const hasWaterForGas = currentContents.some(item => item.id === "water" || item.id === "water-solution");
  const hasGasToDissolve = currentContents.some(item => 
    item.id === "co2" || item.id === "carbon-dioxide-gasbag" || item.id === "oxygen" || item.id === "oxygen-gasbag"
  );
  
  if (hasWaterForGas && hasGasToDissolve) {
    if (vesselId === "pressure-bottle") {
      const gasItem = currentContents.find(item => item.id === "co2" || item.id === "carbon-dioxide-gasbag" || item.id === "oxygen" || item.id === "oxygen-gasbag")!;
      const waterItem = currentContents.find(item => item.id === "water" || item.id === "water-solution")!;
      
      const totalVol = (waterItem.volume ?? 10) + (gasItem.volume ?? 10);
      const totalMass = (waterItem.mass ?? 10) + (gasItem.mass ?? 10);
      
      const itemsToRemove = [gasItem.id, waterItem.id];
      const remainingContents = currentContents.filter(item => !itemsToRemove.includes(item.id));
      
      const product = INORGANIC_LIBRARY.find(item => item.id === "aerated-liquid");
      if (product) {
        remainingContents.push({
          ...product,
          volume: totalVol,
          mass: totalMass
        });
      }
      
      return {
        contents: remainingContents,
        state: "idle",
        note: "Gas + Liquid -> Aerated Liquid. Under pressure in the pressure bottle, the gas remains calmly dissolved in the liquid."
      };
    } else {
      return {
        contents: currentContents,
        state: "idle",
        note: "Gas and Liquid are present. To dissolve the gas into the liquid, use a sealed Pressure Bottle."
      };
    }
  }

  // Custom check for Aerated Liquid Effervescence when not in a pressure bottle
  const hasAeratedLiquid = currentContents.some(item => item.id === "aerated-liquid");
  if (hasAeratedLiquid) {
    if (vesselId !== "pressure-bottle") {
      const liquidItem = currentContents.find(item => item.id === "aerated-liquid")!;
      const remainingContents = currentContents.filter(item => item.id !== "aerated-liquid");
      
      // We will revert it back to water, but gas escapes
      const waterProduct = INORGANIC_LIBRARY.find(item => item.id === "water" || item.id === "water-solution");
      if (waterProduct) {
        remainingContents.push({
          ...waterProduct,
          volume: liquidItem.volume,
          mass: liquidItem.mass
        });
      }
      
      return {
        contents: remainingContents,
        state: "gas",
        note: "Pressure removed! The gas rapidly escapes from the liquid with intense effervescence (bubbles), leaving the normal liquid behind."
      };
    }
  }

  // Custom check for Gold-Copper alloy formation
  const hasGold = currentContents.some(item => item.id === "gold-powder");
  const hasCopper = currentContents.some(item => item.id === "copper-powder");
  
  if (hasGold && hasCopper) {
    if (vesselId === "crucible") {
      if (!isHeated) {
        return {
          contents: currentContents,
          state: "idle",
          note: "Gold powder (Au) and Copper powder (Cu) are mixed. Melt them at high temperature in the furnace to form a homogeneous alloy."
        };
      }
      
      const goldItem = currentContents.find(item => item.id === "gold-powder")!;
      const copperItem = currentContents.find(item => item.id === "copper-powder")!;
      
      const totalMass = (goldItem.mass ?? 10) + (copperItem.mass ?? 10);
      const totalVol = (goldItem.volume ?? 10) + (copperItem.volume ?? 10);
      
      const itemsToRemove = ["gold-powder", "copper-powder"];
      const remainingContents = currentContents.filter(item => !itemsToRemove.includes(item.id));
      
      const product = INORGANIC_LIBRARY.find(item => item.id === "gold-copper-alloy")!;
      remainingContents.push({
        ...product,
        volume: totalVol,
        mass: totalMass
      });
      
      return {
        contents: remainingContents,
        state: "idle",
        note: "Au (s) + Cu (s) -> Au-Cu (alloy). Under the high temperature of the furnace (>1000°C), the gold and copper powders melt and integrate into a single crystal structure, forming a homogeneous gold-copper alloy upon cooling."
      };
    } else {
      return {
        contents: currentContents,
        state: "idle",
        note: "Gold powder (Au) and Copper powder (Cu) are present. Preparing a metal alloy requires a clay crucible and a high-temperature furnace to melt the metals."
      };
    }
  }

  // Custom check for Amalgam formation: Mercury + Sodium
  const hasSodium = currentContents.some(item => item.id === "sodium");
  const hasMercury = currentContents.some(item => item.id === "mercury");
  
  if (hasSodium && hasMercury) {
    if (!hasGloves) {
      return {
        contents: currentContents,
        state: "idle",
        note: "Safety Warning: Handling toxic mercury (Hg) and reactive sodium (Na) requires protective Safety Gloves. Spawn Safety Gloves from the panel."
      };
    }
    
    const sodiumItem = currentContents.find(item => item.id === "sodium")!;
    const mercuryItem = currentContents.find(item => item.id === "mercury")!;
    
    const totalMass = (sodiumItem.mass ?? 10) + (mercuryItem.mass ?? 10);
    const totalVol = (sodiumItem.volume ?? 10) + (mercuryItem.volume ?? 20);
    
    const itemsToRemove = ["sodium", "mercury"];
    const remainingContents = currentContents.filter(item => !itemsToRemove.includes(item.id));
    
    const product = INORGANIC_LIBRARY.find(item => item.id === "sodium-amalgam")!;
    remainingContents.push({
      ...product,
      volume: totalVol,
      mass: totalMass
    });
    
    if (vesselId === "china-dish" || vesselId === "mortar-pestle") {
      return {
        contents: remainingContents,
        state: "idle",
        note: "Na (s) + Hg (l) -> Na-Hg (amalgam). The liquid mercury is completely absorbed by the solid sodium, forming a uniform semi-solid amalgam paste. Safety gloves are worn to protect against toxic mercury exposure."
      };
    } else {
      return {
        contents: remainingContents,
        state: "idle",
        note: "Sodium (Na) and Mercury (Hg) are present. Preparing a sodium amalgam is best performed in a china dish or mortar and pestle."
      };
    }
  }

  // Custom check for Gas Adsorption: Hydrogen + Palladium Plate
  const hasPd = currentContents.some(item => item.id === "palladium-plate");
  const hasH2 = currentContents.some(item => item.id === "hydrogen" || item.id === "hydrogen-gasbag");
  
  if (hasPd && hasH2) {
    if (vesselId === "vacuum-chamber") {
      const pdItem = currentContents.find(item => item.id === "palladium-plate")!;
      const pdIdx = currentContents.findIndex(item => item.id === "palladium-plate");
      if (pdIdx !== -1) currentContents.splice(pdIdx, 1);
      
      const h2ItemsToRemove = ["hydrogen", "hydrogen-gasbag"];
      const remainingContents = currentContents.filter(item => !h2ItemsToRemove.includes(item.id));
      
      const product = INORGANIC_LIBRARY.find(item => item.id === "palladium-adsorbed")!;
      remainingContents.push({
        ...product,
        volume: pdItem.volume ?? 10,
        mass: pdItem.mass ?? 10
      });
      
      return {
        contents: remainingContents,
        state: "idle",
        note: "H2 (g) + Pd (s) -> Pd-H (adsorbed). Hydrogen gas molecules are adsorbed onto the surface and within the pores of the palladium plate. The gas is trapped within the metal lattice, forming a rigid solid metal solution."
      };
    } else {
      return {
        contents: currentContents,
        state: "idle",
        note: "Palladium Plate (Pd) and Hydrogen Gas (H2) are present. Adsorption of hydrogen by palladium requires a sealed vacuum chamber to prevent the gas from escaping."
      };
    }
  }

  // Custom check for Ethanol, Water, and Ethanol-Water Solution mixing (homogeneous single-phase liquid)
  const hasEthanol = currentContents.some(item => item.id === "ethanol");
  const hasWaterLiquid = currentContents.some(item => item.id === "water");
  const hasEthanolSolution = currentContents.some(item => item.id === "ethanol-solution");

  if ((hasEthanol && hasWaterLiquid) || (hasEthanolSolution && (hasEthanol || hasWaterLiquid))) {
    let totalVol = 0;
    const itemsToRemove = ["ethanol", "water", "ethanol-solution"];
    const remainingContents = currentContents.filter(item => {
      if (itemsToRemove.includes(item.id)) {
        totalVol += item.volume ?? 20;
        return false;
      }
      return true;
    });

    const solutionProduct = INORGANIC_LIBRARY.find(item => item.id === "ethanol-solution")!;
    remainingContents.push({
      ...solutionProduct,
      volume: totalVol
    });

    return {
      contents: remainingContents,
      state: "idle",
      note: "Ethanol (C2H5OH) and Water (H2O) mix completely because of their compatible polar properties (hydrogen bonding), forming a uniform single-phase solution. No new chemical bonds are formed, and no separate layers or bubbles are produced."
    };
  }

  // Custom volume-based check for Chloroform + Nitrogen
  const hasChloroform = currentContents.some(item => item.id === "chloroform");
  const hasNitrogen = currentContents.some(item => item.id === "nitrogen" || item.id === "nitrogen-gasbag");
  if (hasChloroform && hasNitrogen) {
    const chloroformItem = currentContents.find(item => item.id === "chloroform")!;
    const nitrogenItem = currentContents.find(item => item.id === "nitrogen" || item.id === "nitrogen-gasbag")!;
    const chloroformVol = chloroformItem.volume ?? 10;
    const nitrogenVol = nitrogenItem.volume ?? 50;

    const chloroformIdx = currentContents.findIndex(item => item.id === "chloroform");
    if (chloroformIdx !== -1) currentContents.splice(chloroformIdx, 1);

    const nitrogenIdx = currentContents.findIndex(item => item.id === "nitrogen" || item.id === "nitrogen-gasbag");
    if (nitrogenIdx !== -1) currentContents.splice(nitrogenIdx, 1);

    if (chloroformVol <= 15) {
      const vaporProduct = INORGANIC_LIBRARY.find(item => item.id === "chloroform-vapor")!;
      currentContents.push({
        ...vaporProduct,
        volume: chloroformVol
      });
      currentContents.push({
        ...nitrogenItem,
        volume: nitrogenVol
      });
      return {
        contents: currentContents,
        state: "gas",
        note: "CHCl3 (l) + N2 (g) -> CHCl3 (g) + N2 (g). A small quantity of chloroform evaporates completely and disperses throughout the nitrogen gas."
      };
    } else {
      const mistProduct = INORGANIC_LIBRARY.find(item => item.id === "mist")!;
      currentContents.push({
        ...mistProduct,
        volume: chloroformVol + nitrogenVol
      });
      return {
        contents: currentContents,
        state: "gas",
        note: "CHCl3 (l) + N2 (g) -> Mist. The chloroform concentration is high, causing condensation and forming a visible vaporous mist or fog."
      };
    }
  }

  // Custom volume-based check for Water + Air
  const hasWater = currentContents.some(item => item.id === "water");
  const hasAir = currentContents.some(item => item.id === "air" || item.id === "air-filled-gasbag");
  if (hasWater && hasAir) {
    const waterItem = currentContents.find(item => item.id === "water")!;
    const airItem = currentContents.find(item => item.id === "air" || item.id === "air-filled-gasbag")!;
    const waterVol = waterItem.volume ?? 10;
    const airVol = airItem.volume ?? 50;

    const waterIdx = currentContents.findIndex(item => item.id === "water");
    if (waterIdx !== -1) currentContents.splice(waterIdx, 1);

    const airIdx = currentContents.findIndex(item => item.id === "air" || item.id === "air-filled-gasbag");
    if (airIdx !== -1) currentContents.splice(airIdx, 1);

    if (waterVol <= 15) {
      currentContents.push({
        ...airItem,
        volume: airVol + waterVol
      });
      return {
        contents: currentContents,
        state: "idle",
        note: "H2O (l) + Air (g) -> Air (g) (Humid). The small amount of water evaporates and disperses into the air completely."
      };
    } else {
      const mistProduct = INORGANIC_LIBRARY.find(item => item.id === "mist")!;
      currentContents.push({
        ...mistProduct,
        volume: waterVol + airVol
      });
      return {
        contents: currentContents,
        state: "gas",
        note: "H2O (l) + Air (g) -> Mist. High moisture concentration in air leads to condensation, resulting in the formation of mist or fog."
      };
    }
  }

  // Custom checks for Camphor Sublimation & Mixing
  const hasCamphorVapor = currentContents.some(item => item.id === "camphor-vapor");
  const hasNitrogenGas = currentContents.some(item => item.id === "nitrogen" || item.id === "nitrogen-gasbag");
  
  if (hasCamphorVapor && hasNitrogenGas) {
    return {
      contents: currentContents,
      state: "gas",
      note: "C10H16O (g) + N2 (g) -> Gas mixture. Nitrogen carries the sublimated camphor vapor, so the white crystals visibly dissolve into a uniform transparent vapor mixture. No solid residue remains at the bottom."
    };
  }

  if (hasCamphorVapor) {
    return {
      contents: currentContents,
      state: "idle",
      note: "C10H16O (g). The solid camphor has sublimated directly into invisible camphor vapor, leaving no residue at the bottom of the flask."
    };
  }

  const hasSolidCamphor = currentContents.some(item => item.id === "camphor");
  if (hasSolidCamphor && hasNitrogenGas) {
    return {
      contents: currentContents,
      state: "idle",
      note: "Solid Camphor (C10H16O) + Nitrogen (N2). Nitrogen starts carrying camphor from the crystal surface; the solid will shrink while camphor vapor mixes through the vessel. Heat will speed up the sublimation."
    };
  }

  if (hasSolidCamphor) {
    return {
      contents: currentContents,
      state: "idle",
      note: "Solid Camphor (C10H16O). Heat the flask with a burner to sublimate the camphor."
    };
  }

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
