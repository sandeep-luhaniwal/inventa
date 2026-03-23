import React from 'react'
import Heading from '../common/Heading'
import Image from 'next/image'
import { TESTIMONIALS_DATA_LIST, TRUSTED_LOGOS_DATA_LIST } from '../common/Helper'
import Paragraph from '../common/Paragraph'
import Icons from '../common/Icons'

const Trusted = () => {
    return (
        <div id='about' className='py-14 md:py-16 lg:py-20 xl:py-24 max-w-330.5 px-4 mx-auto w-full'>
            <Heading bold center mainblack>
                Trusted by educators, makers, and teams
            </Heading>
            <div className="flex justify-center py-10 flex-wrap gap-6 lg:gap-9.5">
                {TRUSTED_LOGOS_DATA_LIST.map((obj, i) => (
                    <Image
                        key={i}
                        src={obj.src}
                        alt={obj.name}
                        width={obj.width}
                        height={obj.height}
                    />
                ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-7.5 pt-3">
                {TESTIMONIALS_DATA_LIST.map((obj, i) => {
                    return (
                        <div key={i} className="border border-offwhite hover:border-blue duration-300 rounded-xl xl:rounded-3xl p-4 md:p-6 lg:py-10 flex items-center gap-4">
                            <Image
                                src={obj.image}
                                alt={obj.name}
                                width={106}
                                height={106}
                            />
                            <div className="">
                                <div className="flex gap-1">
                                    {Array.from({ length: obj.rating }).map((_, index) => (
                                        <Icons key={index} icon="star" />
                                    ))}
                                </div>
                                <Paragraph lg medium className='py-3 lg:py-4' gray>
                                    "{obj.review}"
                                </Paragraph>
                                <Paragraph lg bold mainblack>
                                    {obj.name}
                                </Paragraph>
                                <Paragraph base gray>
                                    {obj.role}
                                </Paragraph>
                            </div>

                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default Trusted
