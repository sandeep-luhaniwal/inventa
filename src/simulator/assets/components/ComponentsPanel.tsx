import React from "react";
import Capacitor3D from "./icons/Capacitor3D";
import Resistor3D from "./icons/Resistor3D";
import LED3D from "./icons/LED3D";
import ComponentCard from "./ComponentCard";
import DraggableCard from "./DraggableCard";

const componentsList = [
  { name: "Resistor", type: "resistor", component: <Resistor3D className="w-24 h-14" /> },
  { name: "Capacitor", type: "capacitor", component: <Capacitor3D className="w-20 h-28" /> },
  { name: "LED", type: "led", component: <LED3D className="w-20 h-28" /> },
];

const ComponentsPanel = () => {
  return (
    <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
      {componentsList.map((item, index) => (
        <DraggableCard key={index} type={item.type}>
          <ComponentCard title={item.name}>
            {item.component}
          </ComponentCard>
        </DraggableCard>
      ))}
    </div>
  );
};

export default ComponentsPanel;