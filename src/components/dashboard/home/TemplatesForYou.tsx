"use client"
import { CATEGORIES_DATA_LIST, TEMPLATES_DATA_LIST } from '@/components/common/Helper'
import Icons from '@/components/common/Icons'
import Paragraph from '@/components/common/Paragraph'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'

const TemplatesForYou = () => {
    const [active, setActive] = useState("All")

    const filteredData =
        active === "All"
            ? TEMPLATES_DATA_LIST
            : TEMPLATES_DATA_LIST.filter(item => item.category === active)

    return (
        <div className='w-full'>
            <div className="flex flex-wrap gap-4 justify-between">
                <Paragraph xl bold mainblack>
                    Templates for you
                </Paragraph>
                <Link href={"/dashboard"} className='text-blue justify-end max-w-max flex gap-2 items-center text-sm font-medium'>
                    See all templates
                    <Icons icon='arrow' />
                </Link>
            </div>
            <div className="flex flex-wrap gap-2.5 mt-5">
                {CATEGORIES_DATA_LIST.map((cat, i) => (
                    <button
                        key={i}
                        onClick={() => setActive(cat)}
                        className={`px-3 py-1.5 md:px-5.5 md:py-3 text-base md:text-lg font-medium cursor-pointer rounded-full border duration-300 hover:border-blue ${active === cat ? "bg-blue text-white border-blue" : "bg-white border-[#E5E7EB]"
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-5">
                {filteredData.map(item => (
                    <div key={item.id} className="bg-white rounded-lg p-1 shadow-[0_1px_4px_0_rgba(0,0,0,0.09)]">
                        <Image
                            width={2000}
                            height={1000}
                            src={item.image}
                            alt={item.title}
                            className='rounded-lg'
                        />
                        <div className="px-3 py-4 flex flex-col gap-1">
                            <Paragraph base green medium>
                                {item.category}
                            </Paragraph>
                            <Paragraph base bold mainblack>
                                {item.title}
                            </Paragraph>
                            <Paragraph sm medium mainblack className='flex items-center gap-2 leading-[120%]'>
                                <Icons icon='watch' />
                                {item.time}
                            </Paragraph>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default TemplatesForYou
