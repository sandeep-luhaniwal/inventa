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
    reactants: ["sodium", "hcl"],
    products: ["nacl-solution", "hydrogen"],
    state: "burst",
    note: "Sodium reacts violently with Hydrochloric Acid (HCl), catching fire and exploding!",
  },
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
    note: "Ethanol (C2H5OH) + Water (H2O) -> Homogeneous single-phase mixture (एक समान समरूपी तरल - Single Phase Liquid). Both liquids are of similar polar nature, so they completely dissolve/merge into each other by forming hydrogen bonds (intermolecular interaction). No new chemical bonds are formed, and no separate layers are produced (दोनों तरल समान प्रकृति के होने के कारण पूरी तरह रासायनिक बंध या इंटरैक्शन बनाकर एक-दूसरे में विलीन हो जाएंगे। कोई परत नहीं बनेगी।)"
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
  {
    reactants: ["gold-powder", "brass-powder"],
    products: ["gold-brass-alloy"],
    state: "idle",
    note: "Au (s) + Cu-Zn (s) -> Au-Cu-Zn (alloy). The gold and brass metals are melted at high temperature and integrate into a single crystal structure, forming a homogeneous alloy upon cooling."
  },
];

export interface ReactionResult {
  contents: InorganicLibraryItem[];
  state?: ReactionRule["state"];
  note?: string;
}

export function resolveReaction(contents: InorganicLibraryItem[], vesselId?: string, hasGloves?: boolean, isHeated?: boolean, isClosed?: boolean, pressure?: number, temperature?: number): ReactionResult {
  const currentContents = contents.map(item => {
    if (item.id === "sodium-metal" || item.id === "Na" || item.symbol === "Na") {
      return { ...item, id: "sodium" };
    }
    if (item.id === "mercury-liquid" || item.id === "Hg" || item.symbol === "Hg") {
      return { ...item, id: "mercury" };
    }
    if (item.id === "dilute-hydrochloric-acid" || item.id === "concentrated-hydrochloric-acid" || item.id === "hydrogen-chloride" || item.id === "hydrogen-chloride-gasbag" || item.id === "HCl" || item.symbol === "HCl" || item.formula === "HCl") {
      return { ...item, id: "hcl" };
    }
    return item;
  });

  const hasSodiumReactant = currentContents.some(item => item.id === "sodium");
  const hasHClReactant = currentContents.some(item => item.id === "hcl");
  const hasWaterReactant = currentContents.some(item => item.id === "water" || item.id === "water-solution" || item.id.includes("solution"));

  if (hasSodiumReactant && (hasHClReactant || hasWaterReactant)) {
    return {
      contents: currentContents,
      state: "idle",
      note: hasHClReactant 
        ? "Sodium is added to Hydrochloric Acid (HCl) and begins to react..." 
        : "Sodium is added to water and begins to react..."
    };
  }

  let reacted = true;
  let reactionState: ReactionRule["state"];
  let reactionNote: string | undefined;

  // Custom check for Gas dissolution (Aerated Liquid)
  const hasWaterForGas = currentContents.some(item => item.id === "water" || item.id === "water-solution");
  const hasGasToDissolve = currentContents.some(item => 
    item.id === "co2" || item.id === "carbon-dioxide-gasbag" || item.id === "oxygen" || item.id === "oxygen-gasbag"
  );
  
  if (hasWaterForGas && hasGasToDissolve) {
    if (isClosed || (pressure !== undefined && pressure >= 1.5)) {
      const gasItem = currentContents.find(item => item.id === "co2" || item.id === "carbon-dioxide-gasbag" || item.id === "oxygen" || item.id === "oxygen-gasbag")!;
      const waterItem = currentContents.find(item => item.id === "water" || item.id === "water-solution")!;
      
      const totalVol = (waterItem.volume ?? 10) + (gasItem.volume ?? 10) * 0.1;
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
        note: `Gas + Liquid -> Aerated Liquid. Under pressure (${(pressure ?? 3.0).toFixed(1)} atm) in the sealed vessel, the gas remains calmly dissolved in the liquid.`
      };
    } else {
      return {
        contents: currentContents,
        state: "idle",
        note: "Gas and Liquid are present. To dissolve the gas into the liquid, apply a Cork Stopper, or increase the Pressure."
      };
    }
  }

  // Custom check for Aerated Liquid Effervescence
  const hasAeratedLiquid = currentContents.some(item => item.id === "aerated-liquid");
  if (hasAeratedLiquid) {
    if (!isClosed || (pressure !== undefined && pressure < 1.2)) {
      const liquidItem = currentContents.find(item => item.id === "aerated-liquid")!;
      const remainingContents = currentContents.filter(item => item.id !== "aerated-liquid");
      
      // We will revert it back to water, but gas escapes (20 mL of CO2 gas, meaning volume of liquid decreases by 10% of 20 = 2 mL)
      const waterProduct = INORGANIC_LIBRARY.find(item => item.id === "water" || item.id === "water-solution");
      if (waterProduct) {
        remainingContents.push({
          ...waterProduct,
          volume: Math.max(10, (liquidItem.volume ?? 10) - 2),
          mass: liquidItem.mass !== undefined ? Math.max(10, liquidItem.mass - 2) : undefined
        });
      }
      
      // Also, produce CO2 (gas) so that it bubbles and then escapes
      const co2Product = INORGANIC_LIBRARY.find(item => item.id === "co2");
      if (co2Product) {
        remainingContents.push({
          ...co2Product,
          volume: 20 // 20 mL of CO2 gas which will bubble and escape
        });
      }
      
      return {
        contents: remainingContents,
        state: "gas",
        note: `Pressure reduced to ${(pressure ?? 1.0).toFixed(1)} atm! The gas rapidly escapes from the liquid with intense effervescence (bubbles), leaving the normal liquid behind.`
      };
    }
  }

  // Custom check for Gold-Copper alloy formation
  const hasGold = currentContents.some(item => item.id === "gold-powder");
  const hasCopper = currentContents.some(item => item.id === "copper-powder");
  
  if (hasGold && hasCopper) {
    if (vesselId === "crucible" || vesselId === "mortar-pestle" || vesselId === "china-dish") {
      const temp = temperature ?? (isHeated ? 1064 : 25);
      if (temp < 1000) {
        return {
          contents: currentContents,
          state: "idle",
          note: "Gold powder (Au) and Copper powder (Cu) are mixed. Heat them with a burner or furnace to melt and form a homogeneous alloy. (सोना और तांबा पाउडर मिले हुए हैं। एक समान मिश्र धातु बनाने के लिए उन्हें बर्नर या भट्टी से गर्म करें।)"
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
        note: "Au (s) + Cu (s) -> Au-Cu (alloy). Under heat, the gold and copper powders melt and integrate into a single crystal structure, forming a homogeneous gold-copper alloy upon cooling. (गर्म करने पर सोने और तांबे के पाउडर पिघलकर एक मिश्र धातु बना लेते हैं।)"
      };
    } else {
      return {
        contents: currentContents,
        state: "idle",
        note: "Gold powder (Au) and Copper powder (Cu) are present. Preparing a metal alloy requires a heat source and a heat-resistant container like a crucible, mortar, or china dish to melt the metals."
      };
    }
  }

  // Custom check for Gold-Brass alloy formation
  const hasBrass = currentContents.some(item => item.id === "brass-powder");
  
  if (hasGold && hasBrass) {
    if (vesselId === "crucible" || vesselId === "mortar-pestle" || vesselId === "china-dish") {
      const temp = temperature ?? (isHeated ? 1064 : 25);
      if (temp < 1000) {
        return {
          contents: currentContents,
          state: "idle",
          note: "Gold powder (Au) and Brass powder (Cu-Zn) are mixed. Heat them with a burner or furnace to melt and form a homogeneous alloy (real gold appearance). (सोना और पीतल पाउडर मिले हुए हैं। एक समान मिश्र धातु बनाने के लिए उन्हें बर्नर या भट्टी से गर्म करें।)"
        };
      }
      
      const goldItem = currentContents.find(item => item.id === "gold-powder")!;
      const brassItem = currentContents.find(item => item.id === "brass-powder")!;
      
      const totalMass = (goldItem.mass ?? 10) + (brassItem.mass ?? 10);
      const totalVol = (goldItem.volume ?? 10) + (brassItem.volume ?? 10);
      
      const itemsToRemove = ["gold-powder", "brass-powder"];
      const remainingContents = currentContents.filter(item => !itemsToRemove.includes(item.id));
      
      const product = INORGANIC_LIBRARY.find(item => item.id === "gold-brass-alloy")!;
      remainingContents.push({
        ...product,
        volume: totalVol,
        mass: totalMass
      });
      
      return {
        contents: remainingContents,
        state: "idle",
        note: "Au (s) + Cu-Zn (s) -> Au-Cu-Zn (alloy). Under heat, the gold and brass powders melt and integrate into a single crystal structure, forming a homogeneous gold-brass alloy (real gold appearance) upon cooling. (गर्म करने पर सोने और पीतल के पाउडर पिघलकर एक मिश्र धातु बना लेते हैं, जो ठंडा होने पर सोने की तरह चमकदार पीला दिखता है।)"
      };
    } else {
      return {
        contents: currentContents,
        state: "idle",
        note: "Gold powder (Au) and Brass powder (Cu-Zn) are present. Preparing a metal alloy requires a heat source and a heat-resistant container like a crucible, mortar, or china dish to melt the metals."
      };
    }
  }

  // Custom check for Amalgam formation: Mercury + Sodium
  const hasSodium = currentContents.some(item => item.id === "sodium");
  const hasMercury = currentContents.some(item => item.id === "mercury");
  
  if (hasSodium && hasMercury) {
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
    
    const noteText = hasGloves
      ? "Na (s) + Hg (l) -> Na-Hg (amalgam). Solid sodium completely absorbs liquid mercury. As a result, the fluidity of mercury disappears, and the atoms of both substances bond together to form a sodium–mercury amalgam. (Na (s) + Hg (l) -> Na-Hg (अमलगम)। ठोस सोडियम लिक्विड पारे को पूरी तरह सोख लेता है। पारे का गीलापन समाप्त हो जाता है और दोनों के परमाणु आपस में बंधकर एक समान अर्ध-ठोस पेस्ट या ठोस ब्लॉक बना लेते हैं।)"
      : "Safety Warning: Handling toxic mercury (Hg) and reactive sodium (Na) without protective Safety Gloves is extremely hazardous! Spawn Safety Gloves from the panel. (सुरक्षा चेतावनी: सुरक्षा दस्तानों (Safety Gloves) के बिना विषैले पारे (Hg) और क्रियाशील सोडियम (Na) को संभालना बेहद खतरनाक है! पैनल से सुरक्षा दस्ताने जोड़ें।)\n\nNa (s) + Hg (l) -> Na-Hg (amalgam). Solid sodium completely absorbs liquid mercury. As a result, the fluidity of mercury disappears, and the atoms of both substances bond together to form a sodium–mercury amalgam. (Na (s) + Hg (l) -> Na-Hg (अमलगम)। ठोस सोडियम लिक्विड पारे को पूरी तरह सोख लेता है। पारे का गीलापन समाप्त हो जाता है और दोनों के परमाणु आपस में बंधकर एक समान अर्ध-ठोस पेस्ट या ठोस ब्लॉक बना लेते हैं।)";

    return {
      contents: remainingContents,
      state: "idle",
      note: noteText
    };
  }

  // Custom check for Gas Adsorption: Hydrogen + Palladium Plate
  const hasPd = currentContents.some(item => item.id === "palladium-plate");
  const hasH2 = currentContents.some(item => item.id === "hydrogen" || item.id === "hydrogen-gasbag");
  const hasAdsorbedPd = currentContents.some(item => item.id === "palladium-adsorbed");

  if ((hasPd && hasH2) || (hasAdsorbedPd && hasH2)) {
    if (vesselId === "vacuum-chamber") {
      return {
        contents: currentContents,
        state: "idle",
        note: "H2 (g) + Pd (s) -> Pd-H (adsorbed) (Adsorption in progress...). The hydrogen molecules are gradually locking into the micro-pores on the surface of the palladium plate (गैस के छोटे अणु ठोस धातु की सतह पर बने बारीक छिद्रों के अंदर जाकर लॉक हो रहे हैं।)"
      };
    } else {
      return {
        contents: currentContents,
        state: "idle",
        note: "Palladium Plate (Pd) and Hydrogen Gas (H2) are present. Adsorption of hydrogen by palladium requires a Vacuum Chamber (वैक्यूम चेंबर), Palladium Plate (पैलेडियम प्लेट), and Gas Inlet Valve (गैस इनलेट वाल्व) to prevent the gas from escaping."
      };
    }
  }

  if (hasAdsorbedPd && !hasH2) {
    return {
      contents: currentContents,
      state: "idle",
      note: "H2 (g) + Pd (s) -> Pd-H (adsorbed) (कठोर ठोस धातु - Adsorbed Solid Metal). The gas is fully locked inside the micro-pores of the palladium plate and cannot escape (गैस के छोटे अणु ठोस धातु की सतह पर बने बेहद बारीक छिद्रों के अंदर जाकर लॉक (Adsorb) हो चुके हैं। गैस बाहर नहीं उड़ पाती।)"
    };
  }

  // Custom check for Hydrogen + Oxygen reaction to form Water
  const hasH2Gas = currentContents.some(item => item.id === "hydrogen" || item.id === "hydrogen-gasbag");
  const hasO2Gas = currentContents.some(item => item.id === "oxygen" || item.id === "oxygen-gasbag");

  if (hasH2Gas && hasO2Gas) {
    if (isHeated) {
      const h2Item = currentContents.find(item => item.id === "hydrogen" || item.id === "hydrogen-gasbag")!;
      const o2Item = currentContents.find(item => item.id === "oxygen" || item.id === "oxygen-gasbag")!;
      const h2Vol = h2Item.volume ?? 50;
      const o2Vol = o2Item.volume ?? 50;

      const reactVolO2 = Math.min(o2Vol, h2Vol / 2);
      const reactVolH2 = reactVolO2 * 2;
      const waterProduced = reactVolH2;

      let updatedContents = currentContents.map(c => {
        if (c.id === "hydrogen" || c.id === "hydrogen-gasbag") {
          return { ...c, volume: Math.max(0, (c.volume ?? 50) - reactVolH2) };
        }
        if (c.id === "oxygen" || c.id === "oxygen-gasbag") {
          return { ...c, volume: Math.max(0, (c.volume ?? 50) - reactVolO2) };
        }
        return c;
      }).filter(c => (c.state === "gas" ? (c.volume ?? 0) > 0.1 : true));

      const waterProduct = INORGANIC_LIBRARY.find(item => item.id === "water")!;
      const existingWaterIdx = updatedContents.findIndex(c => c.id === "water" && c.state === "liquid");
      if (existingWaterIdx !== -1) {
        updatedContents[existingWaterIdx] = {
          ...updatedContents[existingWaterIdx],
          volume: (updatedContents[existingWaterIdx].volume ?? 0) + waterProduced
        };
      } else {
        updatedContents.push({
          ...waterProduct,
          volume: Math.max(10, waterProduced)
        });
      }

      return {
        contents: updatedContents,
        state: "burst",
        note: "2 H2 (g) + O2 (g) -> 2 H2O (l). Under heat/ignition, hydrogen and oxygen react explosively to form water. (गर्म करने पर हाइड्रोजन और ऑक्सीजन तेजी से प्रतिक्रिया करके पानी बनाते हैं।)"
      };
    } else {
      return {
        contents: currentContents,
        state: "idle",
        note: "H2 (g) + O2 (g). A mixture of hydrogen and oxygen gas is present. Apply heat (burner) to ignite and synthesize water. (हाइड्रोजन और ऑक्सीजन का मिश्रण मौजूद है। पानी बनाने की क्रिया शुरू करने के लिए बर्नर से गर्म करें।)"
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
      note: "Ethanol (C2H5OH) + Water (H2O) -> Homogeneous single-phase mixture (एक समान समरूपी तरल - Single Phase Liquid). Both liquids are of similar polar nature, so they completely dissolve/merge into each other by forming hydrogen bonds (intermolecular interaction). No new chemical bonds are formed, and no separate layers are produced (दोनों तरल समान प्रकृति के होने के कारण पूरी तरह रासायनिक बंध या इंटरैक्शन बनाकर एक-दूसरे में विलीन हो जाएंगे। कोई परत नहीं बनेगी।)"
    };
  }

  // Custom check for Salt (sodium-chloride-solid) dissolution
  const hasSaltSolid = currentContents.some(item => item.id === "sodium-chloride-solid");
  const hasSaltSolution = currentContents.some(item => item.id === "nacl-solution");
  if (hasSaltSolid && (hasWaterLiquid || hasSaltSolution)) {
    return {
      contents: currentContents,
      state: "idle",
      note: "NaCl (s) + H2O (l) -> NaCl (aq) (साफ एवं पारदर्शी घोल - Clear Solution). The solid salt crystals break their ionic bonds upon contact with water and dissolve completely into the intermolecular spaces of the water molecules (ठोस क्रिस्टल पानी के संपर्क में आते ही अपने बंध तोड़कर पानी के अणुओं के गैप में पूरी तरह घुलकर अदृश्य हो जाएंगे। कोई गैस नहीं निकलेगी।)"
    };
  }
  if (hasSaltSolution && !hasSaltSolid && currentContents.length === 1) {
    return {
      contents: currentContents,
      state: "idle",
      note: "Sodium chloride solution (NaCl (aq)) (साफ एवं पारदर्शी घोल - Clear Solution). The salt is fully dissolved in water (ठोस क्रिस्टल पानी के अणुओं के गैप में पूरी तरह घुलकर अदृश्य हो चुके हैं।)"
    };
  }

  // Custom check for Sucrose (Sugar) dissolution
  const hasSucroseSolid = currentContents.some(item => item.id === "sucrose");
  const hasSucroseSolution = currentContents.some(item => item.id === "sucrose-solution");
  if (hasSucroseSolid && (hasWaterLiquid || hasSucroseSolution)) {
    return {
      contents: currentContents,
      state: "idle",
      note: "C12H22O11 (s) + H2O (l) -> C12H22O11 (aq) (साफ एवं पारदर्शी घोल - Clear Solution). The solid sugar crystals dissolve completely in water by forming hydrogen bonds (ठोस क्रिस्टल पानी के संपर्क में आते ही अपने बंध तोड़कर पानी के अणुओं के गैप में पूरी तरह घुलकर अदृश्य हो जाएंगे। कोई गैस नहीं निकलेगी।)"
    };
  }
  if (hasSucroseSolution && !hasSucroseSolid && currentContents.length === 1) {
    return {
      contents: currentContents,
      state: "idle",
      note: "Sucrose solution (C12H22O11 (aq)) (साफ एवं पारदर्शी घोल - Clear Solution). The sugar is fully dissolved in water (ठोस क्रिस्टल पानी के अणुओं के गैप में पूरी तरह घुलकर अदृश्य हो चुके हैं।)"
    };
  }

  // Custom check for Glucose dissolution
  const hasGlucoseSolid = currentContents.some(item => item.id === "glucose");
  const hasGlucoseSolution = currentContents.some(item => item.id === "glucose-solution");
  if (hasGlucoseSolid && (hasWaterLiquid || hasGlucoseSolution)) {
    return {
      contents: currentContents,
      state: "idle",
      note: "C6H12O6 (s) + H2O (l) -> C6H12O6 (aq) (साफ एवं पारदर्शी घोल - Clear Solution). The glucose crystals dissolve completely in water (ठोस क्रिस्टल पानी के संपर्क में आते ही अपने बंध तोड़कर पानी के अणुओं के गैप में पूरी तरह घुलकर अदृश्य हो जाएंगे। कोई गैस नहीं निकलेगी।)"
    };
  }
  if (hasGlucoseSolution && !hasGlucoseSolid && currentContents.length === 1) {
    return {
      contents: currentContents,
      state: "idle",
      note: "Glucose solution (C6H12O6 (aq)) (साफ एवं पारदर्शी घोल - Clear Solution). The glucose is fully dissolved in water (ठोस क्रिस्टल पानी के अणुओं के गैप में पूरी तरह घुलकर अदृश्य हो चुके हैं।)"
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
