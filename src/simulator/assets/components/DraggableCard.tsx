import { useRef } from "react";
import { useDrag } from "react-dnd";

const DraggableCard = ({ children, type }: { children: React.ReactNode; type: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag(() => ({
    type,
    item: { type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));
  drag(ref);

  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1, cursor: "grab" }}>
      {children}
    </div>
  );
};

export default DraggableCard;
