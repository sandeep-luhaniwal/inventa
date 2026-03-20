import DashBoardNavBar from "@/components/dashboard/common/DashBoardNavBar";
import SiderBar from "@/components/dashboard/common/SiderBar";
import DesignNavBar from "@/components/design/DesignNavBar";
import { SideBarProvider } from "@/context/SideBarContext";
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
            <DesignNavBar />
            {children}
        </div>
    );
}