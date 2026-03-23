import Image from 'next/image'
import React from 'react'
import Paragraph from '../common/Paragraph'
import Heading from '../common/Heading'
import MainButton from '../common/MainButton'

const FirstProject = () => {
    return (
        <div className="relative z-0">
            <Image
                src="/images/home/svg/bg-first-project.svg"
                width={1440}
                height={700}
                alt="bg-img"
                className='w-full h-full absolute origin-top object-top top-0 object-cover left-0'
            />
            <div className='max-w-330.5 md:px-4 mx-auto w-full pb-14 md:py-16 lg:py-20 xl:py-22 relative z-10'>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-0 items-center">
                    <div className="flex items-center md:rounded-lg overflow-clip">
                        <video src="/videos/first-project.mp4" autoPlay muted loop playsInline className="w-full lg:h-116 object-cover" />
                    </div>
                    <div className="flex flex-col justify-center px-4 sm:px-0 lg:ps-11">
                        <div className="flex gap-2">
                            <Image
                                src="/images/home/png/circle.png"
                                width={1038}
                                height={1038}
                                alt="circle"
                                className='w-9.5 h-9.5'
                            />
                            <Paragraph mainblack bold xl className='pb-3'>
                                Join No #1 Learning Plateform
                            </Paragraph>
                        </div>
                        <Heading bold mainblack>
                            Start building your first project today.
                        </Heading>
                        <Paragraph lg gray className='max-w-139 pt-3 pb-5'>
                            Join millions of students, educators, and creators making amazing things.
                        </Paragraph>
                        <MainButton icon='next' className='hover:border-blue' iconClass='stroke-white group-hover:stroke-blue' blue>
                            Start Free
                        </MainButton>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FirstProject
