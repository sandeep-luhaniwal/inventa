"use client"
import UserProfile from '@/app/dashboard/profile/UserProfile'
import Icons from '@/components/common/Icons'
import Paragraph from '@/components/common/Paragraph'
import { useSideBar } from '@/context/SideBarContext'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'

const DashBoardNavBar = () => {
    const { isOpenSideBar, setIsOpenSideBar } = useSideBar();
    const [isProfile, setIsProfile] = useState(false);

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
            <div className="w-full max-w-100 flex gap-4 items-center justify-end">
                <Paragraph sm gray medium className='hidden lg:flex text-nowrap'>
                    All changes saved
                </Paragraph>
                <button className='bg-blue py-1.5 px-3 xl:px-4 flex items-center flex-nowrap cursor-pointer rounded-lg gap-1 text-white font-medium'>
                    <Icons icon='plus' className='text-white' />
                    Create
                </button> 
                <div className="w-9 h-9 flex items-center justify-center">
                    <Icons icon='bell' />
                </div>
                <div className="w-9 h-9 flex items-center justify-center">
                    <Icons icon='quote' />
                </div>
                <div className="relative">
                    <Image
                        src={"/images/home/svg/client-two.svg"}
                        alt='user'
                        width={106}
                        height={106}
                        onClick={() => setIsProfile(true)}
                        className='w-9 h-9 cursor-pointer'
                    />
                    <div className={`w-40 absolute right-0 top-full mt-2 duration-300 ${isProfile ? "scale-y-100" : "scale-y-0"}`}>
                        <UserProfile onClose={() => setIsProfile(false)} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DashBoardNavBar
