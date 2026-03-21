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
            <div className="py-3.5 my-5 max-w-2xl px-3 bg-white border border-[#E5E7EB] rounded-lg w-full flex items-center gap-2">
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
                        <Link href={"/design"} key={i} className="bg-white relative rounded-xl p-1 shadow-[0_1px_4px_0_rgba(0,0,0,0.09)]">
                            <Image
                                width={2000}
                                height={1000}
                                src={obj.image}
                                alt={obj.title}
                                className='rounded-xl'
                            />
                            {obj.shared && (
                                <span className='absolute top-3 text-xs font-medium right-3 z-20 bg-green text-white px-1.5 py-0.5 rounded-full'>
                                    Shared
                                </span>
                            )}
                            <div className="px-3 py-4 flex flex-col gap-1">
                                <div className="flex gap-2 justify-between">
                                    <Paragraph base green semibold>
                                        {obj.status}
                                    </Paragraph>
                                    {obj.members > 0 &&
                                        <Paragraph sm medium gray className='flex items-center gap-0.5'>
                                            <Icons icon='people' />
                                            {obj.members}
                                        </Paragraph>
                                    }
                                </div>
                                <Paragraph base bold mainblack>
                                    {obj.title}
                                </Paragraph>
                                <Paragraph sm medium mainblack className='flex items-center gap-2 leading-[110%]!'>
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
