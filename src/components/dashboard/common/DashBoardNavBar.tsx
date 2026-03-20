"use client"
import Icons from '@/components/common/Icons'
import Paragraph from '@/components/common/Paragraph'
import { useSideBar } from '@/context/SideBarContext'
import Image from 'next/image'
import React, { useEffect } from 'react'

const DashBoardNavBar = () => {
    const { isOpenSideBar, setIsOpenSideBar } = useSideBar();
    useEffect(() => {
        if (isOpenSideBar) {
            document.body.classList.add("overflow-hidden");
        } else {
            document.body.classList.remove("overflow-hidden");
        }
        return () => {
            document.body.classList.remove("overflow-hidden");
        };
    }, [isOpenSideBar]);
    return (
        <div className='py-3 w-full sticky top-0 bg-white z-50 border-b border-[#E5E7EB] flex justify-between gap-9 px-4 xl:px-6'>
            <div className="lg:hidden" onClick={() => setIsOpenSideBar(!isOpenSideBar)}>
                <Icons icon={isOpenSideBar ? "crossblack" : "menu"} className='' />
            </div>
            <div className="py-2.5 hidden lg:flex max-w-xl px-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg w-full items-center gap-2">
                <Icons icon='search' />
                <input type="search" placeholder='Search projects, templates, lessons…'
                    className='placeholder:text-[#9CA3AF] text-sm outline-none w-full'
                />
            </div>
            <div className="w-full max-w-95 flex gap-4 items-center justify-end">
                <Paragraph xs gray className='hidden lg:flex'>
                    All changes saved
                </Paragraph>
                <button className='bg-blue py-2 px-3 flex items-center flex-nowrap cursor-pointer rounded-lg gap-1 text-white font-medium'>
                    <Icons icon='plus' className='text-white' />
                    Create
                </button>
                <div className="w-9 h-9 flex items-center justify-center">
                    <Icons icon='bell' />
                </div>
                <div className="w-9 h-9 flex items-center justify-center">
                    <Icons icon='quote' />
                </div>
                <Image
                    src={"/images/home/svg/client-two.svg"}
                    alt='user'
                    width={106}
                    height={106}
                    className='w-9 h-9'
                />
            </div>
        </div>
    )
}

export default DashBoardNavBar
