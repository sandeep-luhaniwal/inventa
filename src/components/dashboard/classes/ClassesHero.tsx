import Heading from '@/components/common/Heading'
import { CLASSES_DATA_LIST } from '@/components/common/Helper'
import Icons from '@/components/common/Icons'
import Paragraph from '@/components/common/Paragraph'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const ClassesHero = () => {
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
                    <Image
                    width={100}
                    height={100}
                    alt='border'
                    className='w-6 h-6'
                    src={'/images/dashboard/classes/png/rajasthan.png'}
                    />
                    <Paragraph sm bold mainblack>
                        RBSE
                    </Paragraph>
                </div>
                <Paragraph blue sm medium className='cursor-pointer'>
                    Change board
                </Paragraph>
               
            </div>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {CLASSES_DATA_LIST.map((obj,i)=>{
                        return(
                            <div key={i} className="bg-white p-4 relative lg:p-6 cursor-pointer hover:border-blue duration-300 xl:pb-8 border-2 border-[#E5E7EB] rounded-xl">
                                <Heading small bold mainblack>
                                    {obj.name}
                                </Heading>
                                <Paragraph sm gray className='pt-1'>
                                    RBSE
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
