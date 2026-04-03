import React from "react";

interface Props {
  title: string;
  children: React.ReactNode;
}

const ComponentCard: React.FC<Props> = ({ title, children }) => {
  return (
    <div className="w-44 h-44 bg-gray-100 rounded-2xl shadow-md flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-xl transition">
      
      <div className="flex items-center justify-center h-24">
        {children}
      </div>

      <p className="text-sm font-semibold text-gray-700">{title}</p>
    </div>
  );
};

export default ComponentCard;