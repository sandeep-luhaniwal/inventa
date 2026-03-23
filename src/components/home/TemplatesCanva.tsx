"use client"
import React, { useState } from 'react'
import Heading from '../common/Heading'
import Paragraph from '../common/Paragraph'
import Image from 'next/image'
import Icons from '../common/Icons'
import MainButton from '../common/MainButton'
import { CATEGORIES_DATA_LIST, TEMPLATES_DATA_LIST } from '../common/Helper'


const TemplatesCanva = () => {

    const [active, setActive] = useState("All")

    const filteredData =
        active === "All"
            ? TEMPLATES_DATA_LIST
            : TEMPLATES_DATA_LIST.filter(item => item.category === active)

    return (
        <div id='learning' className='bg-green'>
            <div className="max-w-330.5 px-4 mx-auto w-full pb-14 md:py-16 relative z-10">

                <Heading bold center>
                    Start with templates, not a blank canvas.
                </Heading>

                <Paragraph xl center className='pt-1'>
                    Jump into curated projects and customize them to make them your own.
                </Paragraph>

                {/* Filters */}
                <div className="flex flex-wrap justify-center gap-2.5 mt-4">
                    {CATEGORIES_DATA_LIST.map((cat, i) => (
                        <button
                            key={i}
                            onClick={() => setActive(cat)}
                            className={`px-3 py-1.5 md:px-5.5 lg:px-7.25 md:py-2.5 text-base md:text-lg font-medium cursor-pointer rounded-full ${active === cat ? "bg-yellow" : "bg-white"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-6 md:pt-9 lg:pt-13">
                    {filteredData.map(item => (
                        <div key={item.id} className="bg-white rounded-lg p-1">
                            <Image
                                width={2000}
                                height={1000}
                                src={item.image}
                                alt={item.title}
                                className='rounded-lg'
                            />
                            <div className="px-3 py-4 flex flex-col gap-1">
                                <Paragraph base green semibold>
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
                <div className="flex justify-center pt-8 md:pt-10 lg:pt-13">
                    <MainButton icon='next' iconClass='group-hover:stroke-white'>
                        Browse All Templets
                    </MainButton>

                </div>
            </div>
        </div>
    )
}

export default TemplatesCanva