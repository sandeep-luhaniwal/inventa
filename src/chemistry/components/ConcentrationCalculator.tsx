"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Info, Thermometer, Calculator, Sparkles, AlertCircle, Scale, Gauge, Eye, X } from "lucide-react";
import type { PlacedInorganicItem } from "@/chemistry/types";

// Standard atomic weights for parser
const ATOMIC_WEIGHTS: Record<string, number> = {
  H: 1.008, He: 4.003, Li: 6.94, Be: 9.012, B: 10.81, C: 12.011, N: 14.007, O: 15.999, F: 18.998, Ne: 20.18,
  Na: 22.99, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974, S: 32.06, Cl: 35.45, Ar: 39.948, K: 39.098, Ca: 40.078,
  Sc: 44.956, Ti: 47.867, V: 50.942, Cr: 51.996, Mn: 54.938, Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546, Zn: 65.38,
  As: 74.922, Se: 78.971, Br: 79.904, Kr: 83.798, Rb: 85.468, Sr: 87.62, Y: 88.906, Zr: 91.224, Nb: 92.906, Mo: 95.95,
  Tc: 98, Ru: 101.07, Rh: 102.91, Pd: 106.42, Ag: 107.87, Cd: 112.41, In: 114.82, Sn: 118.71, Sb: 121.76, Te: 127.6,
  I: 126.9, Xe: 131.29, Cs: 132.91, Ba: 137.33, Pt: 195.08, Au: 196.97, Hg: 200.59, Pb: 207.2, Bi: 208.98
};

// Custom chemical species properties
export interface ChemicalSpecies {
  id: string;
  name: string;
  hindiName: string;
  formula: string;
  molarMass: number;
  density?: number; // g/mL, default is 1.0 for solids
  state: "solid" | "liquid" | "gas";
  beta?: number; // volumetric expansion coefficient
}

export const SPECIES_MAP: Record<string, ChemicalSpecies> = {
  // Solutes (Solids)
  "sodium-chloride-solid": { id: "sodium-chloride-solid", name: "Sodium Chloride", hindiName: "सोडियम क्लोराइड (नमक)", formula: "NaCl", molarMass: 58.5, state: "solid" },
  "sucrose": { id: "sucrose", name: "Sucrose", hindiName: "सुक्रोज (चीनी)", formula: "C12H22O11", molarMass: 342.3, state: "solid" },
  "glucose": { id: "glucose", name: "Glucose", hindiName: "ग्लूकोज", formula: "C6H12O6", molarMass: 180.16, state: "solid" },
  "sodium": { id: "sodium", name: "Sodium Metal", hindiName: "सोडियम", formula: "Na", molarMass: 22.99, state: "solid" },
  "iron": { id: "iron", name: "Iron Powder", hindiName: "लोहा पाउडर", formula: "Fe", molarMass: 55.85, state: "solid" },
  "iron-nail": { id: "iron-nail", name: "Iron Nail", hindiName: "लोहे की कील", formula: "Fe", molarMass: 55.85, state: "solid" },
  "copper-powder": { id: "copper-powder", name: "Copper Powder", hindiName: "तांबा पाउडर", formula: "Cu", molarMass: 63.55, state: "solid" },
  "gold-powder": { id: "gold-powder", name: "Gold Powder", hindiName: "सोना पाउडर", formula: "Au", molarMass: 196.97, state: "solid" },
  "brass-powder": { id: "brass-powder", name: "Brass Powder", hindiName: "पीतल पाउडर", formula: "Cu-Zn", molarMass: 128.93, state: "solid" },
  "sodium-carbonate": { id: "sodium-carbonate", name: "Sodium Carbonate", hindiName: "सोडियम कार्बोनेट", formula: "Na2CO3", molarMass: 105.99, state: "solid" },
  "ammonium-chloride": { id: "ammonium-chloride", name: "Ammonium Chloride", hindiName: "अमोनियम क्लोराइड (नौसादर)", formula: "NH4Cl", molarMass: 53.49, state: "solid" },
  "kclo3": { id: "kclo3", name: "Potassium chlorate", hindiName: "पोटेशियम क्लोरेट", formula: "KClO3", molarMass: 122.55, state: "solid" },
  "kmno4": { id: "kmno4", name: "Potassium permanganate", hindiName: "पोटेशियम परमैंगनेट", formula: "KMnO4", molarMass: 158.03, state: "solid" },
  "mno2": { id: "mno2", name: "Manganese dioxide", hindiName: "मैंगनीज डाइऑक्साइड", formula: "MnO2", molarMass: 86.94, state: "solid" },
  
  // Solvents / Liquids
  "water": { id: "water", name: "Water", hindiName: "जल (पानी)", formula: "H2O", molarMass: 18.0, density: 1.0, state: "liquid", beta: 0.00021 },
  "ethanol": { id: "ethanol", name: "Ethanol", hindiName: "एथेनॉल", formula: "C2H5OH", molarMass: 46.07, density: 0.789, state: "liquid", beta: 0.0011 },
  "chloroform": { id: "chloroform", name: "Chloroform", hindiName: "क्लोरोफॉर्म", formula: "CHCl3", molarMass: 119.38, density: 1.49, state: "liquid", beta: 0.0013 },
  "mercury": { id: "mercury", name: "Mercury", hindiName: "पारा", formula: "Hg", molarMass: 200.59, density: 13.53, state: "liquid", beta: 0.00018 },
  
  // Gases
  "co2": { id: "co2", name: "Carbon Dioxide", hindiName: "कार्बन डाइऑक्साइड", formula: "CO2", molarMass: 44.01, state: "gas" },
  "oxygen": { id: "oxygen", name: "Oxygen", hindiName: "ऑक्सीजन", formula: "O2", molarMass: 32.0, state: "gas" },
  "nitrogen": { id: "nitrogen", name: "Nitrogen", hindiName: "नाइट्रोजन", formula: "N2", molarMass: 28.01, state: "gas" },
  "hydrogen": { id: "hydrogen", name: "Hydrogen", hindiName: "हाइड्रोजन", formula: "H2", molarMass: 2.016, state: "gas" }
};

// Fallback molar mass parser
export function parseFormulaMolarMass(formula: string): number {
  let clean = formula.split("·")[0].split(".")[0].replace(/\([a-z]+\)/gi, "").trim();
  if (!clean) return 1.0;

  let expanded = clean;
  const parenRegex = /\(([^)]+)\)([0-9]+)/g;
  let match;
  while ((match = parenRegex.exec(expanded)) !== null) {
    const content = match[1];
    const multiplier = parseInt(match[2], 10);
    let innerExpanded = "";
    let innerMatch;
    const innerRegex = /([A-Z][a-z]?)([0-9]*)/g;
    while ((innerMatch = innerRegex.exec(content)) !== null) {
      const el = innerMatch[1];
      const count = innerMatch[2] ? parseInt(innerMatch[2], 10) : 1;
      innerExpanded += el + (count * multiplier);
    }
    expanded = expanded.replace(match[0], innerExpanded);
    parenRegex.lastIndex = 0;
  }

  const bracketRegex = /\[([^\]]+)\]([0-9]*)/g;
  while ((match = bracketRegex.exec(expanded)) !== null) {
    const content = match[1];
    const multiplier = match[2] ? parseInt(match[2], 10) : 1;
    let innerExpanded = "";
    let innerMatch;
    const innerRegex = /([A-Z][a-z]?)([0-9]*)/g;
    while ((innerMatch = innerRegex.exec(content)) !== null) {
      const el = innerMatch[1];
      const count = innerMatch[2] ? parseInt(innerMatch[2], 10) : 1;
      innerExpanded += el + (count * multiplier);
    }
    expanded = expanded.replace(match[0], innerExpanded);
    bracketRegex.lastIndex = 0;
  }

  const elementRegex = /([A-Z][a-z]?)([0-9]*)/g;
  let totalMass = 0;
  while ((match = elementRegex.exec(expanded)) !== null) {
    const el = match[1];
    const count = match[2] ? parseInt(match[2], 10) : 1;
    const weight = ATOMIC_WEIGHTS[el] ?? 1.0;
    totalMass += weight * count;
  }

  return totalMass || 1.0;
}

interface ConcentrationCalculatorProps {
  item: PlacedInorganicItem;
  onUpdate: (id: string, updates: Partial<PlacedInorganicItem>) => void;
}

export default function ConcentrationCalculator({ item, onUpdate }: ConcentrationCalculatorProps) {
  // Local state for override modes (interactive calculator)
  const [useCustomInput, setUseCustomInput] = useState(false);
  const [selectedSoluteId, setSelectedSoluteId] = useState("sodium-chloride-solid");
  const [selectedSolventId, setSelectedSolventId] = useState("water");
  
  // Custom values
  const [customSoluteMass, setCustomSoluteMass] = useState(10); // grams
  const [customSolventVol, setCustomSolventVol] = useState(100); // mL
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [soluteInputUnit, setSoluteInputUnit] = useState<"g" | "mol">("g");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTabIdx, setActiveTabIdx] = useState<number>(2); // Default to Molarity (index 2)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const particleOffsets = useMemo(() => {
    return Array.from({ length: 150 }).map(() => ({
      x: Math.random() * 80 + 10, // x coordinate (10% to 90%)
      y: Math.random() * 60 + 35, // y coordinate (35% to 95%)
    }));
  }, []);

  // Parse vessel contents
  const vesselContents = item.contents || [];
  
  // Determine actual solute and solvent from vessel contents
  const parsedContents = useMemo(() => {
    if (vesselContents.length === 0) return null;

    const SOLUTION_MAPPING: Record<string, { soluteId: string, solventId: string }> = {
      "nacl-solution": { soluteId: "sodium-chloride-solid", solventId: "water" },
      "sucrose-solution": { soluteId: "sucrose", solventId: "water" },
      "glucose-solution": { soluteId: "glucose", solventId: "water" },
    };

    // 1. Check if there is any solution liquid in the vessel contents
    const solutionItem = vesselContents.find(c => c.id in SOLUTION_MAPPING);
    
    if (solutionItem) {
      const mapping = SOLUTION_MAPPING[solutionItem.id];
      const solidSolute = vesselContents.find(c => c.id === mapping.soluteId && c.state === "solid");
      
      const dissolvedMass = solutionItem.mass ?? 0;
      const undissolvedMass = solidSolute?.mass ?? 0;
      const totalSoluteMass = dissolvedMass + undissolvedMass;

      // Estimate the initial solvent volume by subtracting volume expansion (0.1 mL/g solute)
      const initialSolventVol = Math.max(0, (solutionItem.volume ?? 100) - dissolvedMass * 0.1);

      // Create virtual solvent (Water) representing the solvent part of the solution
      const virtualSolvent = {
        id: mapping.solventId,
        name: "Water",
        symbol: "H2O",
        state: "liquid" as const,
        volume: initialSolventVol,
        mass: initialSolventVol, // 1g/mL density
      };

      // Find the template solute item from SPECIES_MAP
      const soluteTemplate = SPECIES_MAP[mapping.soluteId] || {
        id: mapping.soluteId,
        name: "Solute",
        hindiName: "विलेय",
        formula: "Solute",
        molarMass: 100,
        state: "solid" as const,
      };

      const virtualSolute = {
        ...soluteTemplate,
        symbol: soluteTemplate.formula,
        state: "solid" as const,
        mass: totalSoluteMass > 0.01 ? totalSoluteMass : (solidSolute?.mass ?? 10), // fallback if both are 0
        volume: totalSoluteMass,
      };

      return {
        solute: virtualSolute,
        solvent: virtualSolvent,
        allContents: vesselContents
      };
    }

    // 2. Normal check if no solution item is present (e.g. before reaction starts)
    // Find liquid with largest volume as solvent
    const liquids = vesselContents.filter(c => c.state === "liquid");
    let solvent = liquids.reduce<any>((max, curr) => 
      (curr.volume ?? 0) > (max?.volume ?? 0) ? curr : max, null
    );

    // If no liquid, search solids
    if (!solvent) {
      const solids = vesselContents.filter(c => c.state === "solid");
      solvent = solids.reduce<any>((max, curr) => 
        (curr.mass ?? 0) > (max?.mass ?? 0) ? curr : max, null
      );
    }

    if (!solvent) return null;

    // Remaining items are potential solutes
    const solutes = vesselContents.filter(c => c.id !== solvent.id);
    const primarySolute = solutes[0] || null;

    return {
      solute: primarySolute,
      solvent: solvent,
      allContents: vesselContents
    };
  }, [vesselContents]);

  // Use either custom sandbox values or vessel contents
  const activeParams = useMemo(() => {
    let soluteName = "";
    let soluteHindi = "";
    let soluteFormula = "";
    let soluteMolarMass = 58.44;
    let soluteMass = 10;
    let soluteVol = 0;
    let soluteState: "solid" | "liquid" | "gas" = "solid";

    let solventName = "";
    let solventHindi = "";
    let solventFormula = "";
    let solventMolarMass = 18.015;
    let solventMass = 100;
    let solventVol = 100;
    let solventDensity = 1.0;
    let solventBeta = 0.00021;

    const currentTemp = item.temperature ?? 25;

    if (parsedContents && parsedContents.solute && !useCustomInput) {
      // Use vessel contents
      const s = parsedContents.solute;
      const solv = parsedContents.solvent;

      const matchedSolute = SPECIES_MAP[s.id];
      soluteName = matchedSolute?.name || s.name;
      soluteHindi = matchedSolute?.hindiName || s.name;
      soluteFormula = matchedSolute?.formula || s.symbol || s.id;
      soluteMolarMass = matchedSolute?.molarMass || parseFormulaMolarMass(soluteFormula);
      soluteMass = s.mass ?? s.volume ?? 10;
      soluteVol = s.state === "liquid" || s.state === "gas" ? (s.volume ?? 0) : 0;
      soluteState = s.state as any;

      const matchedSolvent = SPECIES_MAP[solv.id];
      solventName = matchedSolvent?.name || solv.name;
      solventHindi = matchedSolvent?.hindiName || solv.name;
      solventFormula = matchedSolvent?.formula || solv.symbol || solv.id;
      solventMolarMass = matchedSolvent?.molarMass || parseFormulaMolarMass(solventFormula);
      solventDensity = matchedSolvent?.density || 1.0;
      solventVol = solv.volume ?? 100;
      solventMass = solv.mass ?? (solventVol * solventDensity);
      solventBeta = matchedSolvent?.beta || 0.00021;
    } else {
      // Use custom calculator inputs
      const s = SPECIES_MAP[selectedSoluteId];
      soluteName = s.name;
      soluteHindi = s.hindiName;
      soluteFormula = s.formula;
      soluteMolarMass = s.molarMass;
      soluteMass = customSoluteMass;
      soluteVol = s.state === "liquid" || s.state === "gas" ? (customSoluteMass / (s.density || 1.0)) : 0;
      soluteState = s.state;

      const solv = SPECIES_MAP[selectedSolventId];
      solventName = solv.name;
      solventHindi = solv.hindiName;
      solventFormula = solv.formula;
      solventMolarMass = solv.molarMass;
      solventDensity = solv.density || 1.0;
      solventVol = customSolventVol;
      solventMass = customSolventVol * solventDensity;
      solventBeta = solv.beta || 0.00021;
    }

    // Adjust solvent and solution volume for temperature (thermal expansion)
    const expansionFactor = 1 + solventBeta * (currentTemp - 25);
    const solventVolTempAdjusted = solventVol * expansionFactor;
    const solventMassTempAdjusted = solventMass; // Mass remains constant

    // Total solution volume and mass
    const solutionMass = soluteMass + solventMassTempAdjusted;
    
    // Total volume of solution is sum of component volumes
    const soluteVolTempAdjusted = soluteVol * (1 + (soluteState === "liquid" ? (SPECIES_MAP[selectedSoluteId]?.beta || 0.0003) : 0) * (currentTemp - 25));
    const solutionVol = solventVolTempAdjusted + soluteVolTempAdjusted;

    // Mole calculations
    const soluteMoles = soluteMass / soluteMolarMass;
    const solventMoles = solventMass / solventMolarMass;
    const totalMoles = soluteMoles + solventMoles;

    return {
      soluteName,
      soluteHindi,
      soluteFormula,
      soluteMolarMass,
      soluteMass,
      soluteVol: soluteVolTempAdjusted,
      soluteMoles,
      soluteState,

      solventName,
      solventHindi,
      solventFormula,
      solventMolarMass,
      solventMass,
      solventVol: solventVolTempAdjusted,
      solventMoles,
      expansionFactor,

      solutionMass,
      solutionVol,
      totalMoles,
      temperature: currentTemp
    };
  }, [parsedContents, useCustomInput, selectedSoluteId, selectedSolventId, customSoluteMass, customSolventVol, item.temperature]);

  const {
    soluteName, soluteHindi, soluteFormula, soluteMolarMass, soluteMass, soluteVol, soluteMoles, soluteState,
    solventName, solventHindi, solventFormula, solventMolarMass, solventMass, solventVol, solventMoles, expansionFactor,
    solutionMass, solutionVol, totalMoles, temperature
  } = activeParams;

  // Calculate the 7 concentration properties
  const calculations = useMemo(() => {
    // 1. Mass Percent (% w/w)
    const w_w = (soluteMass / solutionMass) * 100;
    
    // 2. Mass/Volume Percent (% w/v)
    const w_v = (soluteMass / solutionVol) * 100;

    // 3. Molarity (M)
    const molarity = soluteMoles / (solutionVol / 1000);

    // 4. Molality (m)
    const molality = soluteMoles / (solventMass / 1000);

    // 5. Mole Fraction
    const moleFraction = soluteMoles / totalMoles;

    // 6. Volume Percent (% v/v)
    const v_v = soluteVol > 0 ? (soluteVol / solutionVol) * 100 : 0;

    // 7. Parts per million (ppm)
    const ppm = (soluteMass / solutionMass) * 1e6;

    return [
      {
        id: 1,
        title: "द्रव्यमान प्रतिशत (% w/w)",
        engTitle: "Mass Percentage",
        unit: "%",
        value: w_w,
        formula: `\\% w/w = \\frac{W_{\\text{solute}}}{W_{\\text{solution}}} \\times 100`,
        plainFormula: "(W_solute / W_solution) * 100",
        step: `(${soluteMass.toFixed(2)}g / ${solutionMass.toFixed(2)}g) × 100`,
        tempDependent: false,
        desc: "विलेय का द्रव्यमान ग्राम में जो 100 ग्राम विलयन में घुला हो।",
        engDesc: "Mass of solute in grams dissolved in 100g of total solution."
      },
      {
        id: 2,
        title: "द्रव्यमान/आयतन प्रतिशत (% w/v)",
        engTitle: "Mass/Volume Percentage",
        unit: "%",
        value: w_v,
        formula: `\\% w/v = \\frac{W_{\\text{solute}}}{V_{\\text{solution}}} \\times 100`,
        plainFormula: "(W_solute / V_solution) * 100",
        step: `(${soluteMass.toFixed(2)}g / ${solutionVol.toFixed(2)}mL) × 100`,
        tempDependent: true,
        desc: "विलेय का द्रव्यमान ग्राम में जो 100 mL विलयन में घुला हो।",
        engDesc: "Mass of solute in grams dissolved in 100mL of total solution."
      },
      {
        id: 3,
        title: "मोलरता (M)",
        engTitle: "Molarity",
        unit: "M (mol/L)",
        value: molarity,
        formula: `M = \\frac{n_{\\text{solute}}}{V_{\\text{solution (L)}}}`,
        plainFormula: "n_solute / V_solution(L)",
        step: `${soluteMoles.toFixed(4)} mol / ${(solutionVol / 1000).toFixed(4)} L`,
        tempDependent: true,
        desc: "विलयन के प्रति लीटर में घुले विलेय के मोलों की संख्या।",
        engDesc: "Number of moles of solute dissolved per liter of solution."
      },
      {
        id: 4,
        title: "मोललता (m)",
        engTitle: "Molality",
        unit: "m (mol/kg)",
        value: molality,
        formula: `m = \\frac{n_{\\text{solute}}}{W_{\\text{solvent (kg)}}}`,
        plainFormula: "n_solute / W_solvent(kg)",
        step: `${soluteMoles.toFixed(4)} mol / ${(solventMass / 1000).toFixed(4)} kg`,
        tempDependent: false,
        desc: "1 किलोग्राम विलायक में घुले विलेय के मोलों की संख्या।",
        engDesc: "Number of moles of solute dissolved per kilogram of solvent."
      },
      {
        id: 5,
        title: "मोल प्रभाज (Mole Fraction)",
        engTitle: "Mole Fraction",
        unit: "",
        value: moleFraction,
        formula: `X_{\\text{solute}} = \\frac{n_{\\text{solute}}}{n_{\\text{solute}} + n_{\\text{solvent}}}`,
        plainFormula: "n_solute / (n_solute + n_solvent)",
        step: `${soluteMoles.toFixed(4)} / (${soluteMoles.toFixed(4)} + ${solventMoles.toFixed(4)})`,
        tempDependent: false,
        desc: "विलेय के मोलों का विलयन के कुल मोलों से अनुपात।",
        engDesc: "Ratio of moles of solute to the total moles in the mixture."
      },
      {
        id: 6,
        title: "आयतन प्रतिशत (% v/v)",
        engTitle: "Volume Percentage",
        unit: "%",
        value: v_v,
        formula: `\\% v/v = \\frac{V_{\\text{solute}}}{V_{\\text{solution}}} \\times 100`,
        plainFormula: "(V_solute / V_solution) * 100",
        step: soluteVol > 0 
          ? `(${soluteVol.toFixed(2)}mL / ${solutionVol.toFixed(2)}mL) × 100` 
          : "N/A (विलेय ठोस है)",
        tempDependent: true,
        desc: "विलेय का आयतन mL में जो 100 mL विलयन में घुला हो।",
        engDesc: "Volume of solute in mL dissolved in 100mL of total solution."
      },
      {
        id: 7,
        title: "पार्ट्स पर मिलियन (ppm)",
        engTitle: "Parts per Million",
        unit: "ppm",
        value: ppm,
        formula: `\\text{ppm} = \\frac{W_{\\text{solute}}}{W_{\\text{solution}}} \\times 10^6`,
        plainFormula: "(W_solute / W_solution) * 10^6",
        step: `(${soluteMass.toFixed(2)}g / ${solutionMass.toFixed(2)}g) × 10^6`,
        tempDependent: false,
        desc: "अति तनु विलयनों के लिए: प्रति मिलियन ग्राम विलयन में विलेय के ग्राम।",
        engDesc: "For trace components: mass of solute per million parts of solution."
      }
    ];
  }, [soluteMass, solutionMass, solutionVol, soluteMoles, solventMass, totalMoles, soluteVol]);

  return (
    <div className="flex flex-col gap-4 text-white">
      {/* Title Header */}
      <div className="flex flex-col gap-2 border-b border-white/10 pb-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 w-full">
          <Calculator className="h-4 w-4 text-blue-400" />
          <span>सांद्रता का प्रकार (Concentration Units)</span>
        </h4>
        <div className="flex items-center justify-between gap-2.5 w-full">
          <button
            type="button"
            title="विस्तृत विश्लेषण और विज़ुअलाइज़ेशन (View full details & visualization)"
            onClick={() => {
              setActiveTabIdx(2); // Default to Molarity
              setIsModalOpen(true);
            }}
            className="flex-1 py-1 px-2.5 bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white rounded-lg transition duration-150 cursor-pointer border border-blue-500/40 flex items-center justify-center gap-1.5 text-[10px] font-bold shadow-md hover:shadow-blue-500/20 active:scale-95"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>विस्तृत विश्लेषण (Analysis Details)</span>
          </button>
          <div className="flex items-center gap-1 text-[10px] text-amber-300 font-medium select-none bg-amber-950/50 px-2.5 py-1 rounded border border-amber-900/40 shrink-0">
            <Thermometer className="h-3.5 w-3.5" />
            <span>तापमान: {temperature}°C</span>
          </div>
        </div>
      </div>

      {/* Show Switch between Live Vessel Contents and Sandbox Calculator */}
      {parsedContents ? (
        <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-xl border border-[#2e3746]/50">
          <span className="text-xs font-semibold text-slate-300">
            {useCustomInput ? "Interactive Calculator Mode" : `Live Vessel Contents: ${soluteName} in ${solventName}`}
          </span>
          <button
            type="button"
            onClick={() => setUseCustomInput(!useCustomInput)}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-[10px] font-bold text-white transition duration-150 cursor-pointer"
          >
            {useCustomInput ? "Use Vessel Contents" : "Customize / Learn"}
          </button>
        </div>
      ) : (
        <div className="text-[11px] bg-slate-900/40 border border-slate-800 p-2.5 rounded-xl text-slate-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-slate-500 shrink-0" />
          <span>vessel खाली है। सांद्रता के सूत्र सीखने के लिए नीचे वैल्यूज एडजस्ट करें।</span>
        </div>
      )}

      {/* Controls Panel (shown if useCustomInput is true or if vessel is empty) */}
      {(useCustomInput || !parsedContents) && (
        <div className="bg-[#1e2330] rounded-xl p-3 border border-[#2e3746] flex flex-col gap-3">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Interactive sandbox</span>
          </span>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Solute Config */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-slate-400">विलेय (Solute)</label>
              <select
                value={selectedSoluteId}
                onChange={(e) => setSelectedSoluteId(e.target.value)}
                className="bg-[#181c24] border border-[#2e3746] rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-blue-500"
              >
                {Object.values(SPECIES_MAP).filter(s => s.state !== "liquid" || s.id === "ethanol").map(s => (
                  <option key={s.id} value={s.id} className="text-black">{s.name} ({s.formula})</option>
                ))}
              </select>

              {/* Unit Toggle */}
              <div className="flex items-center justify-between mt-1 bg-[#181c24] p-1 rounded-lg border border-[#2e3746]/60">
                <span className="text-[8px] text-slate-400 font-bold uppercase pl-1">Unit</span>
                <div className="flex bg-[#0f121a] rounded p-0.5">
                  <button
                    type="button"
                    onClick={() => setSoluteInputUnit("g")}
                    className={`px-1.5 py-0.5 rounded text-[8px] font-black transition-all cursor-pointer ${
                      soluteInputUnit === "g" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Gram (g)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSoluteInputUnit("mol")}
                    className={`px-1.5 py-0.5 rounded text-[8px] font-black transition-all cursor-pointer ${
                      soluteInputUnit === "mol" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Mole (mol)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-0.5">
                {soluteInputUnit === "g" ? (
                  <>
                    <input
                      type="number"
                      min="0.1"
                      max="100"
                      step="0.5"
                      value={customSoluteMass}
                      onChange={(e) => setCustomSoluteMass(Math.max(0.1, Number(e.target.value)))}
                      className="bg-[#181c24] border border-[#2e3746] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 w-20 text-center font-mono"
                    />
                    <span className="text-[10px] text-slate-400 font-medium">grams (ग्राम)</span>
                  </>
                ) : (
                  <>
                    <input
                      type="number"
                      min="0.001"
                      max="5.0"
                      step="0.01"
                      value={Number((customSoluteMass / SPECIES_MAP[selectedSoluteId].molarMass).toFixed(4))}
                      onChange={(e) => {
                        const moles = Math.max(0.001, Number(e.target.value));
                        setCustomSoluteMass(moles * SPECIES_MAP[selectedSoluteId].molarMass);
                      }}
                      className="bg-[#181c24] border border-[#2e3746] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 w-20 text-center font-mono"
                    />
                    <span className="text-[10px] text-slate-400 font-medium">mol (मोल)</span>
                  </>
                )}
              </div>

              {/* Conversion Math Visualizer */}
              <div className="bg-[#0f121a]/55 border border-[#2e3746]/40 rounded-lg p-1.5 text-[8.5px] text-slate-400 mt-1 font-mono leading-relaxed">
                {soluteInputUnit === "g" ? (
                  <div>
                    <span className="text-blue-400">मोल</span> = {customSoluteMass.toFixed(2)}g / {SPECIES_MAP[selectedSoluteId].molarMass} g/mol = <strong className="text-emerald-400">{(customSoluteMass / SPECIES_MAP[selectedSoluteId].molarMass).toFixed(4)} mol</strong>
                  </div>
                ) : (
                  <div>
                    <span className="text-blue-400">ग्राम</span> = {(customSoluteMass / SPECIES_MAP[selectedSoluteId].molarMass).toFixed(4)} mol × {SPECIES_MAP[selectedSoluteId].molarMass} g/mol = <strong className="text-emerald-400">{customSoluteMass.toFixed(2)} g</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Solvent Config */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-slate-400">विलायक (Solvent)</label>
              <select
                value={selectedSolventId}
                onChange={(e) => setSelectedSolventId(e.target.value)}
                className="bg-[#181c24] border border-[#2e3746] rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-blue-500"
              >
                {Object.values(SPECIES_MAP).filter(s => s.state === "liquid").map(s => (
                  <option key={s.id} value={s.id} className="text-black">{s.name} ({s.formula})</option>
                ))}
              </select>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="number"
                  min="10"
                  max="1000"
                  step="10"
                  value={customSolventVol}
                  onChange={(e) => setCustomSolventVol(Math.max(10, Number(e.target.value)))}
                  className="bg-[#181c24] border border-[#2e3746] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 w-16 text-center"
                />
                <span className="text-[10px] text-slate-400">mL</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info summary */}
      <div className="bg-slate-900/30 rounded-xl p-3 border border-white/5 text-[11px] grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <span className="text-slate-400">विलेय (Solute): </span>
          <span className="text-white font-medium">{soluteHindi} ({soluteFormula})</span>
        </div>
        <div>
          <span className="text-slate-400">विलायक (Solvent): </span>
          <span className="text-white font-medium">{solventHindi} ({solventFormula})</span>
        </div>
        <div>
          <span className="text-slate-400">विलेय का द्रव्यमान: </span>
          <span className="text-white font-medium">{soluteMass.toFixed(2)} g ({soluteMoles.toFixed(4)} mol)</span>
        </div>
        <div>
          <span className="text-slate-400">विलायक का आयतन: </span>
          <span className="text-white font-medium">{solventVol.toFixed(1)} mL ({solventMass.toFixed(1)} g)</span>
        </div>
        <div className="col-span-2 border-t border-white/5 pt-1.5 flex items-center gap-1.5 justify-between">
          <span>विलयन का कुल द्रव्यमान: <strong className="text-slate-200">{solutionMass.toFixed(2)} g</strong></span>
          <span>विलयन का कुल आयतन: <strong className="text-slate-200">{solutionVol.toFixed(1)} mL</strong></span>
        </div>
      </div>

      {/* Units List */}
      <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
        {calculations.map((calc, idx) => {
          const isExpanded = expandedCard === idx;
          return (
            <div
              key={calc.id}
              className={`bg-[#2b313c]/60 border hidden_scrollbar rounded-xl transition duration-150 overflow-hidden overflow-y-auto ${
                isExpanded ? "border-blue-500 bg-[#2b313c]" : "border-[#3a4250] hover:border-[#4f5b6f]"
              }`}
            >
              {/* Header/Main click target */}
              <button
                type="button"
                onClick={() => setExpandedCard(isExpanded ? null : idx)}
                className="w-full text-left p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/20 transition duration-150"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-white leading-tight">{calc.title}</span>
                    <span className="text-[9.5px] text-slate-400 font-mono">({calc.engTitle})</span>
                  </div>
                  <div className="text-[10px] mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="font-mono bg-[#141822] px-1.5 py-0.5 rounded text-blue-400 border border-white/5 text-[9px]">{calc.plainFormula}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold border ${
                      calc.tempDependent 
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                        : "bg-slate-800/40 text-slate-400 border-slate-700/50"
                    }`}>
                      {calc.tempDependent ? "तापमान निर्भर" : "तापमान स्वतंत्र"}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end justify-center min-h-[44px]">
                  <span className="text-sm font-black font-mono text-emerald-400 tracking-tight">
                    {calc.unit === "%" ? `${calc.value.toFixed(2)}%` : `${calc.value.toFixed(3)} ${calc.unit}`}
                  </span>
                  <div className="text-[9.5px] text-slate-500 mt-2 font-bold select-none bg-slate-900/40 px-1.5 py-0.5 rounded border border-white/5">
                    {isExpanded ? "छिपाएं ▴" : "गणना देखें ▾"}
                  </div>
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="bg-[#1e2330] border-t border-[#3a4250]/70 p-3.5 text-xs flex flex-col gap-2.5 animate-in slide-in-from-top-2 duration-200">
                  <div className="bg-[#181c24] rounded-lg p-2.5 flex flex-col gap-1.5 border border-[#2e3746]/50">
                    <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">स्टेप-बाय-स्टेप गणना (Step-by-step)</span>
                    <div className="font-mono text-slate-200 text-xs">
                      {calc.plainFormula} = {calc.step}
                    </div>
                    <div className="text-sm font-bold text-emerald-400 font-mono mt-1 pt-1 border-t border-[#2e3746]/30">
                      उत्तर (Result) = {calc.unit === "%" ? `${calc.value.toFixed(4)}%` : `${calc.value.toFixed(4)} ${calc.unit}`}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">विवरण (Description)</span>
                    <p className="text-slate-300 mt-0.5 leading-relaxed">{calc.desc}</p>
                    <p className="text-slate-400 italic text-[11px] mt-0.5">{calc.engDesc}</p>
                  </div>

                  {calc.tempDependent && (
                    <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg p-2 text-amber-300/90 text-[11px] leading-relaxed">
                      <Thermometer className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                      <div>
                        <strong>तापमान का प्रभाव:</strong> विलयन का आयतन तापमान बढ़ने पर फैलता है (Thermal Expansion)।
                        यहाँ तापमान 25°C से {temperature}°C है जिससे विलयन आयतन {(expansionFactor - 1 * 100).toFixed(3)}% बढ़ गया है, जिसके कारण यह सांद्रता घट गई है।
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Immersive 3-Panel Tabbed Details Modal via React Portal */}
      {isModalOpen && mounted && typeof window !== "undefined" && createPortal(
        (() => {
          const activeCalc = calculations[activeTabIdx] || calculations[2];
          return (
            <div 
              className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
              onClick={() => setIsModalOpen(false)}
            >
              <div 
                className="w-[90vw] h-[95vh] bg-[#0c0f17] border border-[#232936] rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-white flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4.5 bg-[#111520] border-b border-[#232936] shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/25">
                      <Calculator className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                        <span>सांद्रता विश्लेषण डैशबोर्ड</span>
                        <span className="text-xs text-blue-400 font-mono font-bold select-none bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">Bilingual Engine v2.5</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">सांद्रता का पूर्ण विवरण, सूत्र, गणना और दृश्य प्रतिनिधित्व (Concentration Analysis, Formula & Visualization)</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition duration-150 cursor-pointer border border-[#2e3746]/50 shadow-md active:scale-95"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Sub-Header Parameters Summary Bar */}
                <div className="px-6 py-3.5 bg-[#090b11]/80 border-b border-[#232936] flex flex-wrap gap-x-6 gap-y-2 text-xs shrink-0 text-slate-300 font-mono">
                  <div>विलेय (Solute): <strong className="text-blue-400">{soluteHindi} ({soluteFormula})</strong></div>
                  <div className="text-slate-700">|</div>
                  <div>विलायक (Solvent): <strong className="text-emerald-400">{solventHindi} ({solventFormula})</strong></div>
                  <div className="text-slate-700">|</div>
                  <div>मिश्रण भार (Solution Mass): <strong className="text-slate-100">{solutionMass.toFixed(2)} g</strong></div>
                  <div className="text-slate-700">|</div>
                  <div>मिश्रण आयतन (Solution Vol): <strong className="text-slate-100">{solutionVol.toFixed(1)} mL</strong></div>
                  <div className="text-slate-700">|</div>
                  <div>तापमान (Temp): <strong className="text-amber-400">{temperature}°C</strong></div>
                </div>

                {/* 3-Panel Main Layout */}
                <div className="flex-1 flex overflow-hidden">
                  
                  {/* Left Column: Side Tab Switcher */}
                  <div className="w-[300px] bg-[#090b11] border-r border-[#232936] flex flex-col p-4 gap-2.5 overflow-y-auto hidden_scrollbar shrink-0 select-none">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 pl-1.5">सांद्रता इकाइयाँ (Units List)</span>
                    {calculations.map((calcItem, cIdx) => {
                      const isActive = activeTabIdx === cIdx;
                      return (
                        <button
                          key={calcItem.id}
                          type="button"
                          onClick={() => setActiveTabIdx(cIdx)}
                          className={`w-full text-left p-3 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col gap-1.5 ${
                            isActive 
                              ? "bg-blue-600/15 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                              : "bg-[#0f131c]/50 border-[#1f2635] text-slate-400 hover:bg-[#151a27] hover:border-[#2b354a] hover:text-slate-200"
                          }`}
                        >
                          <div className="text-xs font-bold leading-snug flex items-center justify-between w-full">
                            <span>{calcItem.title}</span>
                            <span className={`h-2 w-2 rounded-full shrink-0 ${isActive ? "bg-blue-500 animate-pulse" : "bg-slate-700"}`}></span>
                          </div>
                          <div className="flex items-center justify-between text-[9.5px] mt-0.5">
                            <span className="font-mono bg-[#05060a] px-1.5 py-0.5 rounded leading-none text-slate-500 font-medium">{calcItem.plainFormula}</span>
                            <span className="font-mono text-emerald-400 font-black">
                              {calcItem.unit === "%" ? `${calcItem.value.toFixed(1)}%` : `${calcItem.value.toFixed(2)} ${calcItem.unit}`}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Middle Column: Formulas & Calculation details */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-[#0c0f17] hidden_scrollbar">
                    
                    {/* Glowing Calculation Steps Card */}
                    <div className="bg-[#121622] border border-[#232936] rounded-2xl p-6 flex flex-col gap-5 relative overflow-hidden shadow-inner">
                      <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">गणितीय विश्लेषण (Step-by-step Math)</span>
                      
                      {/* Formula display */}
                      <div className="flex flex-col gap-2">
                        <div className="text-xs text-slate-400 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                          <span>सामान्य सूत्र (Formula):</span>
                        </div>
                        <div className="bg-[#090b11] py-3.5 px-4 rounded-xl border border-white/5 font-mono text-blue-400 text-sm flex items-center justify-center font-bold">
                          {activeCalc.plainFormula}
                        </div>
                      </div>

                      {/* Substitution step */}
                      <div className="flex flex-col gap-2">
                        <div className="text-xs text-slate-400 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                          <span>प्रतिस्थापित मान (Substitution):</span>
                        </div>
                        <div className="bg-[#090b11] py-3.5 px-4 rounded-xl border border-white/5 font-mono text-slate-300 text-sm flex items-center justify-center">
                          {activeCalc.step}
                        </div>
                      </div>

                      {/* Result Badge */}
                      <div className="flex flex-col gap-2 border-t border-[#232936] pt-5 mt-2">
                        <div className="text-xs text-slate-400">अंतिम मान (Calculated Result):</div>
                        <div className="bg-emerald-950/20 border border-emerald-500/25 rounded-2xl p-5 flex items-center justify-between shadow-[0_4px_20px_rgba(16,185,129,0.05)]">
                          <div>
                            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">सांद्रता मान (Value)</div>
                            <div className="text-4xl font-extrabold font-mono text-emerald-400 mt-1 select-all tracking-tight">
                              {activeCalc.unit === "%" 
                                ? `${activeCalc.value.toFixed(4)}%` 
                                : `${activeCalc.value.toFixed(4)} ${activeCalc.unit}`
                              }
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] bg-emerald-500/10 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/25 font-bold uppercase tracking-wider inline-block select-none">
                              Active State
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-2 select-none">ID: UNIT-0{activeCalc.id}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bilingual Definitions Card */}
                    <div className="bg-[#121622] border border-[#232936] rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
                      <div>
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <span>इकाई परिभाषा (Hindi Definition)</span>
                        </span>
                        <p className="text-slate-100 text-sm mt-2 leading-relaxed font-sans font-medium">{activeCalc.desc}</p>
                      </div>
                      
                      <div className="border-t border-[#232936] pt-4 mt-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">English Explanation</span>
                        <p className="text-slate-400 text-xs mt-2 leading-relaxed italic font-sans">{activeCalc.engDesc}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Visual Beaker & Temp Info */}
                  <div className="w-[360px] bg-[#090b11] border-l border-[#232936] flex flex-col p-6 gap-6 overflow-y-auto hidden_scrollbar shrink-0">
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">दृश्य प्रदर्शन (Simulation)</span>
                    
                    {/* Beaker Container */}
                    <div className="flex flex-col items-center justify-center min-h-[280px] bg-[#0c0f17] rounded-2xl border border-[#232936] p-4 relative overflow-hidden shadow-inner">
                      {/* SVG Beaker */}
                      <svg width="200" height="240" viewBox="0 0 220 260" className="drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]">
                        <defs>
                          <linearGradient id="beakerLiquidGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.75" />
                          </linearGradient>
                          <linearGradient id="glassSideGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
                            <stop offset="15%" stopColor="#ffffff" stopOpacity="0.06" />
                            <stop offset="85%" stopColor="#ffffff" stopOpacity="0.06" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.28" />
                          </linearGradient>
                        </defs>

                        {(() => {
                          const maxCap = 1000;
                          const fillRatio = Math.min(1.0, solutionVol / maxCap);
                          const liquidH = 160 * fillRatio;
                          const liquidY = 220 - liquidH;
                          
                          // Count of solute particles inside beaker
                          const scaledMolarity = (soluteMoles / (solutionVol / 1000)) || 0;
                          const particleCount = Math.min(65, Math.max(5, Math.round(scaledMolarity * 15 + 5)));

                          return (
                            <>
                              {/* Blue Liquid */}
                              {liquidH > 0 && (
                                <rect
                                  x="25"
                                  y={liquidY}
                                  width="170"
                                  height={liquidH}
                                  fill="url(#beakerLiquidGrad)"
                                  className="transition-all duration-300"
                                  rx="2"
                                />
                              )}

                              {/* Interactive floating particles */}
                              {liquidH > 0 && particleOffsets.slice(0, particleCount).map((offset, pIdx) => {
                                const particleY = liquidY + (offset.y - 35) / 60 * liquidH;
                                const particleX = 25 + (offset.x - 10) / 80 * 170;

                                return (
                                  <circle
                                    key={pIdx}
                                    cx={particleX}
                                    cy={particleY}
                                    r={3.5 + (pIdx % 2.5)}
                                    fill={soluteState === "solid" ? "#c084fc" : "#22d3ee"}
                                    opacity="0.8"
                                  >
                                    <animate
                                      attributeName="transform"
                                      type="translate"
                                      values="0 0; 0 -4; 0 0"
                                      dur={`${2.2 + (pIdx % 4) * 0.4}s`}
                                      repeatCount="indefinite"
                                      begin={`${(pIdx % 6) * 0.3}s`}
                                    />
                                  </circle>
                                );
                              })}

                              {/* Marking Ticks */}
                              {Array.from({ length: 9 }).map((_, mIdx) => {
                                const markVal = (mIdx + 1) * 100;
                                const markY = 220 - (160 * (markVal / 1000));
                                return (
                                  <g key={mIdx} opacity="0.3">
                                    <line x1="180" y1={markY} x2="195" y2={markY} stroke="#ffffff" strokeWidth="1" />
                                    <text x="175" y={markY + 3.5} fill="#ffffff" fontSize="7" textAnchor="end" fontFamily="monospace" fontWeight="bold">
                                      {markVal}ml
                                    </text>
                                  </g>
                                );
                              })}

                              {/* Glass Body */}
                              <path
                                d="M 25 30 L 25 220 Q 25 235 40 235 L 180 235 Q 195 235 195 220 L 195 30"
                                fill="none"
                                stroke="#ffffff"
                                strokeWidth="3"
                                strokeOpacity="0.4"
                                strokeLinecap="round"
                              />
                              <path
                                d="M 25 30 L 25 220 Q 25 235 40 235 L 180 235 Q 195 235 195 220 L 195 30"
                                fill="url(#glassSideGrad)"
                                stroke="none"
                                strokeLinecap="round"
                              />

                              {/* Label */}
                              <text x="110" y="252" fill="#64748b" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                                {soluteFormula} in {solventFormula} ({solutionVol.toFixed(0)} mL)
                              </text>
                            </>
                          );
                        })()}
                      </svg>

                      {/* Visual Legend */}
                      <div className="absolute bottom-2 left-3.5 flex flex-col gap-1 text-[8.5px] text-slate-400 font-sans leading-none">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                          <span>विलायक (Solvent)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse"></span>
                          <span>विलेय (Solute: {soluteFormula})</span>
                        </div>
                      </div>
                    </div>

                    {/* Temperature dependency info card */}
                    {activeCalc.tempDependent ? (
                      <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-amber-300/95 text-xs leading-relaxed shadow-sm">
                        <Thermometer className="h-5 w-5 shrink-0 text-amber-400 animate-bounce" />
                        <div>
                          <h4 className="font-extrabold text-amber-300">तापमान पर निर्भरता (Volume-based)</h4>
                          <p className="mt-1 font-sans">
                            इस गणना में विलयन के **आयतन (Volume)** का उपयोग किया जाता है। तापमान बदलने पर विलयन फैलता या सुकुड़ता है।
                            यहाँ तापमान 25°C से <strong>{temperature}°C</strong> होने पर विलयन का आयतन <strong>{expansionFactor.toFixed(4)} गुना</strong> बढ़ा है, जिससे सांद्रता थोड़ी घट गई है।
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 bg-blue-950/15 border border-blue-500/20 rounded-2xl p-4 text-blue-200/95 text-xs leading-relaxed shadow-sm">
                        <Info className="h-5 w-5 shrink-0 text-blue-400" />
                        <div>
                          <h4 className="font-extrabold text-blue-300">तापमान स्वतंत्र (Mass-based)</h4>
                          <p className="mt-1 font-sans">
                            इस गणना में **द्रव्यमान (Mass)** का उपयोग किया जाता है। द्रव्यमान तापमान बदलने से अपरिवर्तित रहता है। इसलिए यह सांद्रता तापमान में उतार-चढ़ाव से पूरी तरह से अप्रभावित और स्थिर रहती है।
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-[#111520] border-t border-[#232936] flex items-center justify-between shrink-0 select-none">
                  <span className="text-[10px] text-slate-500 font-mono font-medium">INVENTA Simulators • Advanced Lab Suite</span>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white transition duration-150 cursor-pointer shadow-lg hover:shadow-blue-500/20 active:scale-95 border border-blue-500/30"
                  >
                    बंद करें (Close Dashboard)
                  </button>
                </div>
              </div>
            </div>
          );
        })(),
        document.body
      )}
    </div>
  );
}
