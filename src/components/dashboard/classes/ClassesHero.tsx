"use client"
import Heading from '@/components/common/Heading'
import { BOARDS_DASHBOARD_DATA, CLASSES_DATA_LIST } from '@/components/common/Helper'
import Icons from '@/components/common/Icons'
import Paragraph from '@/components/common/Paragraph'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const ClassesHero = () => {
    const router = useRouter()
    const [selectedBoard, setSelectedBoard] = useState<{ title: string; logo: string } | null>(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("selectedBoard")
            if (stored) {
                const board = BOARDS_DASHBOARD_DATA.find((b) => b.title === stored)
                return board ? { title: board.title, logo: board.logo } : null
            }
        }
        return null
    })
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const handleSelectClass = (className: string) => {
        localStorage.setItem("selectedClass", className)
        router.push("/design")
    }

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
                setIsOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleChangeBoard = (board: { title: string; logo: string }) => {
        localStorage.setItem('selectedBoard', board.title)
        setSelectedBoard(board)
        setIsOpen(false)
    }
    return (
        <div className='w-full'>
            <div className="flex gap-2 items-center pb-1.5">
                <Link href={'/dashboard/board'} className='text-gray hover:text-main-black text-sm font-medium'>
                    Board
                </Link>
                <Icons icon='arrow' className='stroke-[#99A1AF]' />
                <Paragraph sm medium blue>
                    Class
                </Paragraph>
            </div>
             <Heading small bold mainblack>
                Select your Class
            </Heading>
            <div className="py-4 md:py-5 flex gap-3 items-center">
                <div className="flex gap-2 items-center border bg-white border-[#E5E7EB] p-2 rounded-lg">
                    {selectedBoard && (
                        <Image width={100} height={100} alt={selectedBoard.title} className='w-6 h-6' src={selectedBoard.logo} />
                    )}
                    <Paragraph sm bold mainblack>
                        {selectedBoard?.title || 'Board'}
                    </Paragraph>
                </div>
                <div className="relative" ref={dropdownRef}>
                    <button onClick={() => setIsOpen(!isOpen)} className='text-blue text-sm font-medium cursor-pointer'>
                        Change board
                    </button>
                    {isOpen && (
                        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                            {BOARDS_DASHBOARD_DATA.filter(b => b.title !== selectedBoard?.title).map((board, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleChangeBoard(board)}
                                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                                >
                                    <Image width={24} height={24} alt={board.title} className='w-6 h-6' src={board.logo} />
                                    <Paragraph sm medium mainblack>{board.title}</Paragraph>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {CLASSES_DATA_LIST.map((obj,i)=>{
                        return(
                            <div key={i} onClick={() => handleSelectClass(obj.name)} className="bg-white p-4 relative lg:p-6 cursor-pointer hover:border-blue duration-300 xl:pb-8 border-2 border-[#E5E7EB] rounded-xl">
                                <Heading small bold mainblack>
                                    {obj.name}
                                </Heading>
                                <Paragraph sm gray className='pt-1'>
                                      {selectedBoard?.title || 'Board'}
                                </Paragraph>
                                {obj.recommended && (
                                    <span className="absolute top-2 right-2 text-[12px] font-medium bg-[#F0FDF4] text-green px-2 py-1 rounded-lg">
                                        Recommended
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>
        </div>
    )
}

export default ClassesHero
