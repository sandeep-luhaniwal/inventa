import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Physics Lab - Inventa",
  description: "Interactive virtual physics laboratory for Class 12 experiments.",
};

export default function PhysicsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="physics-root">{children}</div>;
}
