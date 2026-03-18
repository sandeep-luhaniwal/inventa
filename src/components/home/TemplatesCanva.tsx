"use client"
import React, { useState } from 'react'
import Heading from '../common/Heading'
import Paragraph from '../common/Paragraph'
import Image from 'next/image'
import Icons from '../common/Icons'
import MainButton from '../common/MainButton'

const templatesData = [
    {
        id: 1,
        title: "LED Circuit Basics",
        category: "Electronics",
        time: "5 min",
        image: "/images/home/webp/template-img-1.webp"
    },
    {
        id: 2,
        title: "My First 3D House",
        category: "3D",
        time: "15 min",
        image: "/images/home/webp/template-img-2.webp"
    },
    {
        id: 3,
        title: "Simple Robot Arm",
        category: "Projects",
        time: "30 min",
        image: "/images/home/webp/template-img-3.webp"
    },
    {
        id: 4,
        title: "Solar System Model",
        category: "Classroom",
        time: "15 min",
        image: "/images/home/webp/template-img-4.webp"
    },
    {
        id: 5,
        title: "Traffic Light Sim",
        category: "Electronics",
        time: "5 min",
        image: "/images/home/webp/template-img-5.webp"
    },
    {
        id: 6,
        title: "Geometric Art",
        category: "Beginner",
        time: "10 min",
        image: "/images/home/webp/template-img-6.webp"
    },
    {
        id: 7,
        title: "Bridge Engineering",
        category: "Projects",
        time: "5 min",
        image: "/images/home/webp/template-img-7.webp"
    },
    {
        id: 8,
        title: "Dice Roller Game",
        category: "Beginner",
        time: "8 min",
        image: "/images/home/webp/template-img-8.webp"
    }
]

const categories = [
    "All",
    "Beginner",
    "Classroom",
    "Electronics",
    "3D",
    "Projects",
    "Trending"
]

const TemplatesCanva = () => {

    const [active, setActive] = useState("All")

    const filteredData =
        active === "All"
            ? templatesData
            : templatesData.filter(item => item.category === active)

    return (
        <div className='bg-green'>
            <div className="max-w-330.5 px-4 mx-auto w-full pb-14 md:py-16 relative z-10">

                <Heading bold center>
                    Start with templates, not a blank canvas.
                </Heading>

                <Paragraph xl center className='pt-1'>
                    Jump into curated projects and customize them to make them your own.
                </Paragraph>

                {/* Filters */}
                <div className="flex flex-wrap justify-center gap-2.5 mt-4">
                    {categories.map((cat, i) => (
                        <button
                            key={i}
                            onClick={() => setActive(cat)}
                            className={`px-5.5 py-3 text-base md:text-lg font-medium cursor-pointer rounded-full ${active === cat ? "bg-yellow" : "bg-white"
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