import React from 'react'
import Heading from '../common/Heading'
import Paragraph from '../common/Paragraph'
import { CHOOSE_YOUR_PATH_DATA_LIST } from '../common/Helper'
import Icons from '../common/Icons'
import Link from 'next/link'

const YourPath = () => {
    return (
        <div className='relative max-w-360 mx-auto w-full'>
            <span className='block w-72 h-72 rounded-full absolute bottom-5 left-20 bg-yellow blur-[290px]'></span>
            <span className='block w-72 h-72 rounded-full absolute top-30 right-28 bg-[#4F39F6] blur-[290px]'></span>
            <div className="max-w-280 xl:px-0 px-4 mx-auto w-full pb-14 md:py-16 lg:py-20 xl:py-22 relative z-10">
                <Heading bold center mainblack>
                    Choose your path
                </Heading>
                <Paragraph xl center gray className='pt-1'>
                    Pick how you want to get started. We'll tailor your experience.
                </Paragraph>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-4 lg:gap-6 md:grid-cols-3 pt-6 md:pt-8 lg:pt-8">
                    {CHOOSE_YOUR_PATH_DATA_LIST.map((obj, i) => {
                        return (
                            <div key={i} className="bg-white rounded-lg p-4 sm:p-6 md:p-4 lg:p-6 xl:p-8">
                                <Icons icon={obj.icon} />
                                <Paragraph className={`${obj.className} py-3`} bold>
                                    {obj.title}
                                </Paragraph>
                                <Paragraph base bold mainblack className='pt-1'>
                                    {obj.description}
                                </Paragraph>
                                <ul className="list-disc pl-5 text-sm md:text-base py-4 md:py-5 text-main-black">
                                    <li>{obj.list_one}</li>
                                    <li>{obj.list_two}</li>
                                </ul>
                                <Link href={obj.url} className='text-blue flex items-center gap-2 font-bold text-base md:text-lg duration-300 group hover:text-yellow'>
                                    {obj.button}
                                    <Icons icon='next' className='stroke-blue group-hover:stroke-yellow duration-300 group-hover:translate-x-1' />
                                </Link>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default YourPath
