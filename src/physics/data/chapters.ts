import { PhysicsChapter } from "../types/physics";

export const physicsChapters: PhysicsChapter[] = [
  {
    id: "chapter-1",
    number: 1,
    title: "Electric Charges and Fields",
    titleHi: "वैद्युत आवेश तथा क्षेत्र",
    description:
      "Explore the fundamental properties of electric charges, Coulomb's law, and electric fields through interactive virtual experiments.",
    topics: [
      {
        id: "coulombs-law",
        title: "Coulomb's Law",
        titleHi: "कूलम्ब का नियम",
        route: "/design/physics/chapter-1/coulombs-law",
        icon: "⚡",
        status: "ready",
        description:
          "Visualize the electrostatic force between two point charges and explore how charge magnitude and distance affect the force.",
      },
      {
        id: "charging-by-friction",
        title: "Charging by Friction",
        titleHi: "घर्षण द्वारा आवेशन",
        route: "/design/physics/chapter-1/charging-by-friction",
        icon: "🔋",
        status: "coming-soon",
        description:
          "Understand how rubbing two objects transfers electrons, creating positive and negative charges.",
      },
      {
        id: "electric-field-lines",
        title: "Electric Field Lines",
        titleHi: "वैद्युत क्षेत्र रेखाएँ",
        route: "/design/physics/chapter-1/electric-field-lines",
        icon: "🧲",
        status: "coming-soon",
        description:
          "Visualize the pattern and properties of electric field lines around charged bodies.",
      },
      {
        id: "electric-dipole",
        title: "Electric Dipole",
        titleHi: "वैद्युत द्विध्रुव",
        route: "/design/physics/chapter-1/electric-dipole",
        icon: "🔄",
        status: "coming-soon",
        description:
          "Study the behavior of an electric dipole in a uniform electric field.",
      },
    ],
  },
];
