import Image from 'next/image'
import React from 'react'
import Heading from '../common/Heading'
import Paragraph from '../common/Paragraph'
import MainButton from '../common/MainButton'

const StartBuild = () => {
    return (
        <div className="relative bg-blue">
            <Image
                src="/images/home/svg/bg-first-project.svg"
                width={1440}
                height={700}
                alt="bg-img"
                className='w-full h-full absolute object-cover left-0 opacity-10'
            />
            <div className='max-w-265.75 xl:px-0 px-4 mx-auto w-full py-16 md:py-20 lg:py-28 xl:py-38 relative z-10'>
                <Heading center bold>
                    Start building your first project today.
                </Heading>
                <Paragraph xl center className='pt-1'>
                    oin millions of students, educators, and creators making amazing things.
                </Paragraph>
                <div className="flex justify-center gap-4.5 pt-5">
                    <MainButton yellow icon='next' iconClass='group-hover:stroke-blue'>
                        Start Free
                    </MainButton>
                    <MainButton className='border-white' blue icon='next' iconClass='group-hover:stroke-blue stroke-white'>
                        Explore Templets
                    </MainButton>
                </div>
            </div>
        </div>
    )
}

export default StartBuild
