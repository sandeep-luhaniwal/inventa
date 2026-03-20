"use client"
import Heading from '@/components/common/Heading'
import { CURRENT_PROJECTS_WORKING_LIST } from '@/components/common/Helper'
import Icons from '@/components/common/Icons'
import Paragraph from '@/components/common/Paragraph'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'


const DashBoardHero = () => {
    const [selected, setSelected] = useState("Rajasthan")
    const [activeFilter, setActiveFilter] = useState("All")
    const [hoveredBoard, setHoveredBoard] = useState<string | null>(null)
    return (
        <div className='w-full'>
            <Heading small bold mainblack>
                Welcome back, Sarah
            </Heading>
            <Paragraph sm gray medium className='pt-2'>
                Pick up where you left off or start something new.
            </Paragraph>
            <div className="py-3.5 my-5 max-w-2xl px-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg w-full flex items-center gap-2">
                <Icons icon='search' />
                <input type="search" placeholder='Search board (CBSE, UP Board, HBSE…)'
                    className='placeholder:text-[#717182] text-sm outline-none w-full'
                />
            </div>

            <Paragraph xl bold mainblack>
                Continue working
            </Paragraph>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-3">
                {CURRENT_PROJECTS_WORKING_LIST.map((obj, i) => {
                    return (
                        <Link href={"/design"} key={i} className="bg-white rounded-xl p-1 shadow-[0_1px_4px_0_rgba(0,0,0,0.09)]">
                            <Image
                                width={2000}
                                height={1000}
                                src={obj.image}
                                alt={obj.title}
                                className='rounded-xl'
                            />
                            <div className="px-3 py-4 flex flex-col gap-1">
                                <Paragraph base green medium>
                                    {obj.status}
                                </Paragraph>
                                <Paragraph base bold mainblack>
                                    {obj.title}
                                </Paragraph>
                                <Paragraph sm medium mainblack className='flex items-center gap-2 leading-[120%]'>
                                    <Icons icon='watch' />
                                    {obj.time}
                                </Paragraph>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

export default DashBoardHero
