import Image from 'next/image'
import React from 'react'
import Heading from '../common/Heading'
import Paragraph from '../common/Paragraph'
import { OUR_PLANS_Data } from '../common/Helper'
import Icons from '../common/Icons'
import MainButton from '../common/MainButton'

const OurPlan = () => {
  return (
    <div id="pricing" className="relative">
      <Image
        src="/images/home/svg/bg-first-project.svg"
        width={1440}
        height={700}
        alt="bg-img"
        className='w-full h-full absolute origin-top object-top top-0 object-cover left-0'
      />
      <div className='max-w-265.75 xl:px-0 px-4 mx-auto w-full py-14 md:py-16 lg:py-20 relative z-10'>
        <Heading center bold mainblack>
          Simple, honest pricing
        </Heading>
        <Paragraph xl center gray className='pt-1'>
          Start free, upgrade when you're ready.
        </Paragraph>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 md:gap-3 lg:gap-9.5 gap-9.5 pt-9">
          {OUR_PLANS_Data.map((obj, i) => {
            return (
              <div key={i} className={`bg-white border-2 border-offwhite relative rounded-lg px-4 lg:px-5 md:px-3 duration-300 hover:border-blue py-6 lg:py-7`}>
                {obj.highlight && (
                  <p className="bg-blue text-sm md:text-base text-white font-medium absolute max-w-max left-1/2 -translate-x-1/2 -top-3.5 md:-top-4 px-6 py-1 rounded-full">
                    Popular
                  </p>
                )}

                <Paragraph mainblack bold className='leading-[115%]!'>
                  {obj.title}
                </Paragraph>
                <Paragraph base medium lightgray>
                  {obj.subtitle}
                </Paragraph>
                <Heading bold mainblack className='pt-2'>
                  {obj.price}
                </Heading>
                <Paragraph base medium lightgray>
                  {obj.duration}
                </Paragraph>
                <span className='block w-23 h-px bg-[#DDDDDD] mt-2'></span>
                <div className="my-5 space-y-3">
                  {obj.features.map((item, index) => (
                    <Paragraph key={index} medium mainblack lg className='flex items-center gap-1'>
                      <Icons icon='greentick' /> {item}
                    </Paragraph>
                  ))}
                </div>
                <MainButton className='w-full max-w-full! border-main-black! hover:border-transparent! lg:py-3.5!'>
                  {obj.button}
                </MainButton>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default OurPlan
