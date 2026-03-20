"use client"
import { createContext, useContext, useState } from "react"

const SideBarContext = createContext<{
    isOpenSideBar: boolean
    setIsOpenSideBar: (val: boolean) => void
} | null>(null)

export const SideBarProvider = ({ children }: { children: React.ReactNode }) => {
    const [isOpenSideBar, setIsOpenSideBar] = useState(false)
    return (
        <SideBarContext.Provider value={{ isOpenSideBar, setIsOpenSideBar }}>
            {children}
        </SideBarContext.Provider>
    )
}

export const useSideBar = () => {
    const ctx = useContext(SideBarContext)
    if (!ctx) throw new Error("useSideBar must be used within SideBarProvider")
    return ctx
}
