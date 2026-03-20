"use client"
import { DASHBOARD_SIDERBAR_MENU } from '@/components/common/Helper'
import Icons from '@/components/common/Icons'
import Paragraph from '@/components/common/Paragraph'
import { useSideBar } from '@/context/SideBarContext'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const SiderBar = () => {
  const pathname = usePathname();
  const { isOpenSideBar, setIsOpenSideBar } = useSideBar()
  return (
    <div className=''>
      <span onClick={() => setIsOpenSideBar(false)} className={`${isOpenSideBar ? "h-full w-full left-0" : "w-0 h-full -left-full"} duration-300 block lg:hidden w-full h-full absolute top-0  bg-black/5`}></span>
      <div className={`${isOpenSideBar ? "left-0 shadow-2xl shadow-dark-black" : "-left-50 lg:left-0 shadow-none"} lg:fixed absolute max-w-50 lg:shadow-none bg-white border-e min-h-screen border-[#E5E7EB] lg:max-w-64 w-full top-0 duration-300 flex flex-col justify-between`}>

        <div className="relative z-10">
          <div className='w-full border-b border-[#E5E7EB] p-4 lg:px-6 lg:py-5'>
            <Link href={"/dashboard"}>
              <Image
                src={'/images/home/png/main-logo.png'}
                alt='logo'
                width={156}
                height={38}
                className='w-25 sm:w-28 lg:w-39'
              />
            </Link>
          </div>
          <div className="px-3 py-4 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-220px)]">
            {DASHBOARD_SIDERBAR_MENU.map((obj, i) => {
              const isActive = pathname === obj.path
              return (
                <Link href={`${obj.path}`} key={i} className={`px-3 py-2.5 rounded-lg items-center flex gap-2 xl:gap-3 duration-300
                ${isActive
                    ? "bg-blue/10"
                    : "hover:bg-blue/20 text-offblack"
                  }`}>
                  <Icons icon={obj.icon} className={`stroke-offblack ${isActive && "stroke-blue!"}`} />
                  <Paragraph base medium className={`text-base! ${isActive ? "text-blue!" : "text-offblack!"}`}>{obj.title}</Paragraph>
                </Link>
              )
            })}
          </div>
        </div>
        <div className="p-4">
          <div className="p-4 rounded-lg bg-linear-to-b from-blue to-green">
            <Paragraph sm bold className='flex gap-2 items-center'>
              <span className='w-4 h-4'> <Icons icon='starmulti' /></span>
              Free Plan
            </Paragraph>
            <Paragraph xs className='opacity-90 pt-1 pb-2'>
              3 of 10 projects used
            </Paragraph>
            <button className='text-sm py-2 font-bold flex justify-center w-full cursor-pointer bg-white text-blue duration-300 hover:bg-blue rounded-lg hover:text-white'>
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SiderBar
