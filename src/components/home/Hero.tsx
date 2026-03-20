import React from 'react'
import Paragraph from '../common/Paragraph'
import Heading from '../common/Heading'
import MainButton from '../common/MainButton'
import Link from 'next/link'
import Icons from '../common/Icons'

const Hero = () => {
  return (
    <div className='grid lg:grid-cols-2 lg:gap-6'>
      <div className="flex flex-col gap-4 relative z-20 py-14 lg:py-34 order-2 lg:order-1">
        <Heading big bold>
          Create, Learn, and <span className='text-yellow'>Share in Minutes.</span>
        </Heading>
        <Paragraph xl>
          He beginner-friendly browser tool for building projects, circuits, and 3D models. Perfect for students, educators, and curious creators.
        </Paragraph>
       <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 sm:gap-6">
         <MainButton icon='next' iconClass='group-hover:stroke-white'>
          Start Learning Free
        </MainButton>
        <Link href={"/"} className='flex gap-1.5 text-white items-center text-base md:text-lg font-bold group duration-300 hover:text-yellow'>
          Watch 60s Demo
          <Icons icon='playvideo' className="duration-300 group-hover:stroke-yellow" />
        </Link>
       </div>
      </div>
      <div className="relative order-1 lg:order-2 pt-11 md:pt-14 lg:pt-0">
        <video src="/videos/main-hero.mp4" autoPlay muted loop playsInline className="w-full lg:absolute bottom-0 lg:-translate-x-10 xl:-translate-x-3 scale-110 lg:scale-150 xl:scale-142 origin-bottom" />
      </div>
    </div>
  )
}

export default Hero
