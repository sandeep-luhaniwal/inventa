import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Design - Inventa",
    description: "Dashboard page",
};


export default function DesignLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="">
            {/* <DesignNavBar /> */}
            {children}
        </div>
    );
}
