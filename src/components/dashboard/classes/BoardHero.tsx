"use client"
import Heading from '@/components/common/Heading'
import { BOARDS_DASHBOARD_DATA } from '@/components/common/Helper'
import Icons from '@/components/common/Icons'
import Paragraph from '@/components/common/Paragraph'
import Image from 'next/image'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

const FILTERS = ["All", "National", "State"]

const BoardHero = () => {
    const router = useRouter()
    const [activeFilter, setActiveFilter] = useState("All")
    const [hoveredBoard, setHoveredBoard] = useState<string | null>(null)

    const handleSelectBoard = (boardTitle: string) => {
        localStorage.setItem('selectedBoard', boardTitle)
        router.push('/dashboard/classes')
    }
    return (
        <div className='w-full'>
            <Heading small bold mainblack>
                Choose your Board/University
            </Heading>
            <Paragraph sm gray medium className='pt-2'>
                Select your board to load classes, subjects, and lectures.
            </Paragraph>
            <div className="py-3.5 my-5 max-w-2xl px-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg w-full flex items-center gap-2">
                <Icons icon='search' />
                <input type="search" placeholder='Search board (CBSE, UP Board, HBSE…)'
                    className='placeholder:text-[#717182] text-sm outline-none w-full'
                />
            </div>
            <div className="flex flex-wrap pb-5 gap-2">
                {FILTERS.map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-3 py-1.5 md:px-5.5 md:py-3 rounded-full cursor-pointer duration-300 border text-sm 
                            ${activeFilter === filter ? "border-blue bg-blue text-white" : "border-[#E5E7EB] hover:border-blue text-dark-black"}`}
                    >
                        {filter}
                    </button>
                ))}
            </div>
            <Paragraph lg medium mainblack>
                Popular boards
            </Paragraph>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                {BOARDS_DASHBOARD_DATA.filter((board) =>
                    activeFilter === "All" ? true :
                        activeFilter === "National" ? board.type === "National Board" :
                            board.type === "State Board"
                ).map((board, index) => {
                    const isHovered = hoveredBoard === board.title

                    return (
                        <div
                            key={index}
                            onMouseEnter={() => setHoveredBoard(board.title)}
                            onMouseLeave={() => setHoveredBoard(null)}
                            className={`relative border rounded-xl  duration-300 flex flex-col justify-between
                            ${isHovered ? "border-blue shadow-md"
                                    : "border-[#E5E7EB] hover:shadow-sm"
                                }`}
                        >
                            <div className="p-4 pb-0 md:pb-4 xl:p-5">
                                {board.popular && (
                                    <span className="absolute top-3 right-3 font-medium text-xs bg-[#EEF2FF] text-blue px-2 py-1 rounded-lg">
                                        Popular
                                    </span>
                                )}
                                <Image
                                    src={board.logo}
                                    alt={board.title}
                                    width={48}
                                    height={48}
                                    className="mb-4"
                                />
                                <Paragraph sm bold mainblack>
                                    {board.title}
                                </Paragraph>
                                <Paragraph xs gray className="pt-px">
                                    {board.desc}
                                </Paragraph>
                                <span className="inline-block mt-3.5 text-xs text-dark-black bg-[#F3F4F6] px-2 py-1 rounded">
                                    {board.type}
                                </span>
                            </div>
                            {(isHovered) && (
                                <div
                                    onClick={() => handleSelectBoard(board.title)}
                                    className="absolute hidden lg:flex justify-center cursor-pointer bottom-0 left-0 w-full bg-blue text-white text-center py-2 rounded-b-xl text-sm font-medium"
                                >
                                    Select Board
                                </div>
                            )}
                            <div
                                onClick={() => handleSelectBoard(board.title)}
                                className=" lg:hidden cursor-pointer bottom-0 left-0 w-full bg-blue text-white text-center py-2 rounded-b-xl text-sm font-medium"
                            >
                                Select Board
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}


export default BoardHero
