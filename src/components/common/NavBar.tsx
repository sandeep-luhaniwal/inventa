"use client"
import Image from 'next/image'
import Link from 'next/link'
import { MENU_DATA_LIST } from './Helper'
import Icons from './Icons'
import { useEffect, useState } from 'react'

const NavBar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    useEffect(() => {
        if (isMenuOpen) {
            document.body.classList.add("overflow-hidden");
        } else {
            document.body.classList.remove("overflow-hidden");
        }
        return () => {
            document.body.classList.remove("overflow-hidden");
        };
    }, [isMenuOpen]);
    return (
        <div>
            <div className="bg-white relative z-20 rounded-full w-full px-3 py-2 sm:px-4 sm:py-3 flex justify-between items-center gap-4">
                <Link href={"/"}>
                    <Image
                        src={'/images/home/png/main-logo.png'}
                        alt='logo'
                        width={156}
                        height={38}
                        className='w-25 sm:w-28 lg:w-39'
                    />
                </Link>
                <div className="md:flex hidden items-center gap-4 lg:gap-6 xl:gap-8">
                    {MENU_DATA_LIST.map((obj, i) => {
                        return (
                            <Link key={i} href={obj.url} className='text-dark-black font-bold duration-300 hover:text-blue'>
                                {obj.title}
                            </Link>
                        )
                    })}
                </div>
                <div className="flex items-center gap-4">
                    <Link href={"/auth/sign-in"} className='text-sky-blue text-sm sm:text-base font-bold duration-300 hover:text-main-black rounded-full px-0 sm:px-3 py-2.5 lg:px-6 lg:py-3 sm:hover:bg-vivid'>
                        Sign In
                    </Link>
                    <Link href={"/auth"} className='text-white bg-blue text-sm sm:text-base hover:bg-vivid rounded-full px-3 py-2.5 lg:px-6 lg:py-3 font-bold duration-300 hover:text-main-black'>
                        Get Started
                    </Link>
                    <div onClick={() => setIsMenuOpen(true)} className="md:hidden cursor-pointer">
                        <Icons icon='menu' />
                    </div>
                </div>

            </div>
            <div className={`fixed md:hidden top-0 ${isMenuOpen ? 'left-0' : '-left-full'} duration-300 bg-blue h-screen w-full z-100 p-6 flex flex-col gap-4`}>
                <div className="absolute top-3 right-3" onClick={() => setIsMenuOpen(false)}>
                    <Icons icon='cross' />
                </div>
                {MENU_DATA_LIST.map((obj, i) => {
                    return (
                        <Link onClick={() => setIsMenuOpen(false)} key={i} href={obj.url} className='text-white text-xl font-bold duration-300 hover:text-blue'>
                            {obj.title}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

export default NavBar
