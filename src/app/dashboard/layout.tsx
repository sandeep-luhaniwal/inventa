import DashBoardNavBar from "@/components/dashboard/common/DashBoardNavBar";
import SiderBar from "@/components/dashboard/common/SiderBar";
import { SideBarProvider } from "@/context/SideBarContext";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard - Inventa",
    description: "Dashboard page",
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SideBarProvider>
            <div className="antialiased flex max-w-400 mx-auto w-full lg:w-[calc(100vw - 256px)] relative">
                <SiderBar />
                <div className="lg:ml-64 w-full">
                    <DashBoardNavBar />
                    {children}
                </div>
            </div>
        </SideBarProvider>
    );
}