/**
 * Component info data for the "Learn more" modal.
 * Keyed by componentId prefix (e.g. "led", "resistor", "battery9v", etc.)
 */

export interface ComponentSection {
  title: string;
  content: string;
}

export interface ComponentInfo {
  displayName: string;
  tagline: string;
  description: string;
  sections: ComponentSection[];
}

const LED_INFO: ComponentInfo = {
  displayName: "LED",
  tagline: "Light-Emitting Diode",
  description:
    "An LED (Light-Emitting Diode) is a semiconductor device that emits light when current flows through it in the forward direction.",
  sections: [
    {
      title: "How it works",
      content:
        "When a forward voltage is applied across the p-n junction of an LED, electrons recombine with holes and release energy in the form of photons — producing visible light. The colour depends on the semiconductor material (e.g. GaAs for red, GaN for blue).",
    },
    {
      title: "Connect it",
      content:
        "The longer leg (Anode, +) connects to the positive supply through a current-limiting resistor (typically 220 Ω – 1 kΩ). The shorter leg (Cathode, −) connects to GND. Without the resistor the LED will burn out immediately.",
    },
    {
      title: "How it is used",
      content:
        "LEDs are used as indicator lights, display backlights, status indicators in electronics projects, traffic lights, and general illumination. In circuits they are most commonly used to show whether power is on or to signal a logic HIGH.",
    },
    {
      title: "Get started",
      content:
        'Connect the Anode (+, long leg) to the positive terminal of a 5 V supply through a 220 Ω resistor. Connect the Cathode (−, short leg) to GND. The LED should light up. Try toggling the power with a push button for a simple "blink" experiment.',
    },
    {
      title: "More information",
      content:
        "Forward voltage: 1.8 V – 3.3 V depending on colour. Typical forward current: 10 – 20 mA. Maximum reverse voltage: ~5 V. Package: T-1 3/4 (5 mm) through-hole is most common for hobby use.",
    },
  ],
};

const RESISTOR_INFO: ComponentInfo = {
  displayName: "Resistor",
  tagline: "Passive current-limiting element",
  description:
    "A resistor is a passive two-terminal component that opposes the flow of electric current, producing a voltage drop proportional to the current (Ohm's Law: V = IR).",
  sections: [
    {
      title: "How it works",
      content:
        "Resistors limit current flow using resistive material (carbon film, metal film, or wire-wound). The resistance value is indicated by coloured bands. Ohm's Law (V = I × R) governs its behaviour.",
    },
    {
      title: "Connect it",
      content:
        "Resistors are non-polarised — connect either leg to either terminal. In series with an LED, place the resistor between the positive supply and the LED Anode.",
    },
    {
      title: "How it is used",
      content:
        "Used for current limiting (protecting LEDs), voltage dividers, pull-up/pull-down networks for digital inputs, signal filtering, and biasing transistors.",
    },
    {
      title: "Get started",
      content:
        "Wire a 220 Ω resistor in series with an LED between 5 V and GND. Use the formula R = (Vsupply − Vforward) / Idesired to choose the right resistor value.",
    },
    {
      title: "More information",
      content:
        "Common values: 220 Ω, 330 Ω, 1 kΩ, 10 kΩ. Tolerance: ±1% (metal film) or ±5% (carbon film). Power ratings: 1/4 W for most hobby applications.",
    },
  ],
};

const BATTERY_9V_INFO: ComponentInfo = {
  displayName: "Battery 9V",
  tagline: "Portable DC power source",
  description:
    "A standard 9 V rectangular battery provides a regulated DC voltage source for powering small circuits and breadboard experiments.",
  sections: [
    {
      title: "How it works",
      content:
        "The battery contains electro-chemical cells. A chemical reaction drives electrons from the negative terminal through the external circuit to the positive terminal, providing electromotive force (EMF) of 9 V.",
    },
    {
      title: "Connect it",
      content:
        "Connect the positive terminal (+) to your circuit's VCC rail and the negative terminal (−) to GND. Never short-circuit the terminals together.",
    },
    {
      title: "How it is used",
      content:
        "Powers portable electronics, Arduino projects, and breadboard circuits. Typical capacity: 500–600 mAh for alkaline cells.",
    },
    {
      title: "Get started",
      content:
        "Clip the 9 V battery connector to the battery. Connect positive (red wire) to VCC and negative (black wire) to GND on the breadboard power rails.",
    },
    {
      title: "More information",
      content:
        "Voltage: 9 V nominal. Chemistry: Alkaline (most common) or NiMH rechargeable. Internal resistance increases as battery depletes, causing voltage sag under load.",
    },
  ],
};

const BATTERY_AA_INFO: ComponentInfo = {
  displayName: "Battery AA",
  tagline: "Single-cell 1.5 V power source",
  description:
    "An AA alkaline battery is a single 1.5 V cell, commonly used in pairs or quads to provide 3 V or 6 V for low-power circuits.",
  sections: [
    {
      title: "How it works",
      content:
        "Uses zinc anode, manganese dioxide cathode, and potassium hydroxide electrolyte to produce 1.5 V per cell through an electrochemical reaction.",
    },
    {
      title: "Connect it",
      content:
        "Use a battery holder for single or multiple AA cells. Connect the positive terminal to VCC and negative to GND. Multiple cells in series add voltage; in parallel they add capacity.",
    },
    {
      title: "How it is used",
      content:
        "Low-power microcontroller projects, sensor nodes, remote controls. Typical capacity: 2400–3000 mAh at low discharge rates.",
    },
    {
      title: "Get started",
      content:
        "Place two AA cells in a 2-AA battery holder for 3 V, or four cells for 6 V. Wire into your breadboard power rail.",
    },
    {
      title: "More information",
      content:
        "Nominal voltage: 1.5 V per cell. Fully discharged: ~0.9 V per cell. Size: 14.5 mm diameter × 50.5 mm long. Weight: ~23 g.",
    },
  ],
};

const CAPACITOR_INFO: ComponentInfo = {
  displayName: "Capacitor",
  tagline: "Energy-storing passive component",
  description:
    "A capacitor stores and releases electrical energy in an electric field formed between two conductive plates separated by a dielectric.",
  sections: [
    {
      title: "How it works",
      content:
        "Applying voltage causes charge to accumulate on the plates (Q = C × V). When voltage is removed, the capacitor discharges, providing current to the circuit. It blocks DC but allows AC signals.",
    },
    {
      title: "Connect it",
      content:
        "Electrolytic capacitors are polarised — the longer leg (Anode) connects to the more positive voltage. The white stripe on the body marks the negative (Cathode) leg. Ceramic and film capacitors are non-polarised.",
    },
    {
      title: "How it is used",
      content:
        "Power supply decoupling (filtering), timing circuits (RC networks), signal coupling and bypassing, energy storage in flash circuits.",
    },
    {
      title: "Get started",
      content:
        "Add a 100 µF electrolytic capacitor across a power supply rail (+ to VCC, − to GND) to smooth voltage ripple. Always check polarity before powering on.",
    },
    {
      title: "More information",
      content:
        "Common values: 0.1 µF (ceramic decoupling), 10 – 1000 µF (electrolytic bulk storage). Voltage rating must exceed circuit voltage. ESR affects performance at high frequencies.",
    },
  ],
};

const DIODE_INFO: ComponentInfo = {
  displayName: "Diode",
  tagline: "Unidirectional current valve",
  description:
    "A diode is a two-terminal semiconductor device that conducts current primarily in one direction (forward bias), and blocks reverse current.",
  sections: [
    {
      title: "How it works",
      content:
        "Current flows from Anode  to Cathode  when forward voltage exceeds ~0.6–0.7 V (for silicon). In reverse bias the depletion region widens and blocks current (up to the breakdown voltage).",
    },
    {
      title: "Connect it",
      content:
        "The cathode is marked with a silver/grey band. Connect Anode to the positive side and Cathode to the lower-potential side. For reverse-polarity protection, place in series with the power supply.",
    },
    {
      title: "How it is used",
      content:
        "Rectification (AC → DC), reverse-polarity protection, freewheeling diode across motor coils, signal demodulation, voltage clamping.",
    },
    {
      title: "Get started",
      content:
        "Wire the 1N4007 in series in a simple circuit. Measure voltage drop across it with a multimeter — should read ~0.65 V when conducting.",
    },
    {
      title: "More information",
      content:
        "1N4007 specs: Forward voltage ~1 V at 1 A, peak reverse voltage 1000 V, maximum average current 1 A, package: DO-41.",
    },
  ],
};

const PUSHBUTTON_INFO: ComponentInfo = {
  displayName: "Push Button",
  tagline: "Momentary tactile switch",
  description:
    "A momentary push button closes a circuit only while it is pressed. Releasing the button opens the circuit again.",
  sections: [
    {
      title: "How it works",
      content:
        "Internally, two sets of contacts bridge when the button cap is pressed down, completing the circuit. Spring-loaded contacts reopen automatically when released.",
    },
    {
      title: "Connect it",
      content:
        "The standard 4-pin tactile button has two pairs of shorted pins. Opposite-diagonal pins are connected only when pressed. Use a pull-down or pull-up resistor (10 kΩ) on the digital input pin to avoid floating logic levels.",
    },
    {
      title: "How it is used",
      content:
        "User input in microcontroller projects, reset buttons, interrupt triggers, keypad matrices, debounce circuits.",
    },
    {
      title: "Get started",
      content:
        "Connect one pin to 5 V through 10 kΩ (pull-up). Connect the opposite pin to GND. Read the digital input — it reads HIGH normally, LOW when pressed.",
    },
    {
      title: "More information",
      content:
        "Contact rating: typically 50 mA at 12 V DC. Actuation force: ~1.6 N. Bounce time: ~5 ms — add software debouncing or an RC filter for reliable digital reads.",
    },
  ],
};

const SLIDESWITCH_INFO: ComponentInfo = {
  displayName: "Slide Switch",
  tagline: "Latching 3-position toggle",
  description:
    "A slide switch is a latching switch with a sliding actuator that routes the common pin to one of two positions and stays there until moved.",
  sections: [
    {
      title: "How it works",
      content:
        "The centre pin is the Common terminal. Sliding the actuator connects Common to either the left (Position 1) or right (Position 2) contact. The connection is maintained without holding the switch.",
    },
    {
      title: "Connect it",
      content:
        "Connect the Common (centre) pin to your signal or power rail. Connect Position 1 and Position 2 pins to the two circuit paths you want to switch between.",
    },
    {
      title: "How it is used",
      content:
        "Power on/off switches, mode selection, signal routing, polarity reversal, switching between two power sources.",
    },
    {
      title: "Get started",
      content:
        "Connect Common to VCC. Connect Position 1 to an LED circuit and Position 2 to another. Sliding the switch alternates which LED is powered.",
    },
    {
      title: "More information",
      content:
        "Contact rating: typically 0.5 A at 50 V DC. Electrical life: 5,000–10,000 cycles. Insulation resistance: >100 MΩ.",
    },
  ],
};

const BREADBOARD_INFO: ComponentInfo = {
  displayName: "Breadboard",
  tagline: "Prototyping platform with no-solder connections",
  description:
    "A breadboard is a reusable prototyping board with an array of connected holes, allowing electronic components to be quickly inserted and connected without soldering.",
  sections: [
    {
      title: "How it works",
      content:
        "Metal clips run horizontally across 5-hole rows (A–E and F–J). The two outer rails run vertically down the board. Inserting component leads into the same row creates an electrical connection.",
    },
    {
      title: "Connect it",
      content:
        "Use the red (+) rail for VCC and the blue (−) rail for GND. Wire components across the centre channel (DIP ICs bridge this gap perfectly). Use jump wires to connect rows to power rails.",
    },
    {
      title: "How it is used",
      content:
        "Rapid circuit prototyping, lab experiments, testing circuit designs before committing to PCB layout.",
    },
    {
      title: "Get started",
      content:
        "Connect a 5 V supply to the power rails. Insert an LED with a 220 Ω resistor: resistor from VCC rail to row X, LED Anode in same row X, LED Cathode in row Y, wire from Y to GND rail.",
    },
    {
      title: "More information",
      content:
        "Standard breadboard: 830 tie points. Row pitch: 2.54 mm (0.1 inch). Maximum wire gauge: AWG 22. Suitable for DC and low-frequency AC signals; not ideal for >10 MHz circuits.",
    },
  ],
};

const CHARGED_SPHERE_INFO: ComponentInfo = {
  displayName: "Charged Sphere",
  tagline: "Electrostatics conductor model",
  description:
    "A charged metal sphere is used to study electrostatics. It stores excess positive or negative charge on its outer surface and helps demonstrate charging, induction, grounding, electric field, and potential.",
  sections: [
    {
      title: "How it works",
      content:
        "Charge exists in two forms: positive and negative. Like charges repel and unlike charges attract. In a conducting sphere, free electrons move easily, so excess charge redistributes itself over the outer surface until electrostatic equilibrium is reached.",
    },
    {
      title: "Methods of Charging",
      content:
        "A body can be charged mainly by friction, conduction, and induction. Friction transfers electrons during rubbing, conduction transfers charge by direct contact, and induction redistributes charges without direct contact. Earthing is used with induction to leave a net charge on the conductor.",
    },
    {
      title: "Metal conductor",
      content:
        "Metals are good conductors because they contain free electrons. When a metal sphere is charged, these electrons move quickly across the surface, making the charge spread out uniformly on the outer boundary of the sphere.",
    },
    {
      title: "Earthing",
      content:
        "Earthing means connecting the conductor to the ground so excess electrons can flow to earth or electrons can flow in from earth. It is used to neutralize charge or to complete charging by induction in a controlled way.",
    },
    {
      title: "Electrostatic ideas",
      content:
        "The electric field around a charged sphere acts radially. Electric flux depends on the net enclosed charge, and Gauss's theorem helps explain the field symmetry. Potential is highest near positive charge and lower near negative charge. Capacitance describes how much charge the sphere can store for a given potential.",
    },
  ],
};

export const COMPONENT_INFO_MAP: Record<string, ComponentInfo> = {
  led: LED_INFO,
  resistor: RESISTOR_INFO,
  battery9v: BATTERY_9V_INFO,
  batteryaa: BATTERY_AA_INFO,
  capacitor: CAPACITOR_INFO,
  diode: DIODE_INFO,
  pushbutton: PUSHBUTTON_INFO,
  slideswitch: SLIDESWITCH_INFO,
  breadboard: BREADBOARD_INFO,
  sphere: CHARGED_SPHERE_INFO,
  sphere_red: CHARGED_SPHERE_INFO,
};

export function getComponentInfo(componentId: string): ComponentInfo | null {
  // Try exact match first
  if (COMPONENT_INFO_MAP[componentId]) return COMPONENT_INFO_MAP[componentId];
  // Try prefix match (e.g. "led_red" → "led")
  const prefix = Object.keys(COMPONENT_INFO_MAP).find((k) => componentId.startsWith(k));
  return prefix ? COMPONENT_INFO_MAP[prefix] : null;
}
