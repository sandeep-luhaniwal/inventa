import Image from 'next/image'
import React from 'react'
import Icons from '../common/Icons'
import Paragraph from '../common/Paragraph'

const DesignLayout = () => {
  return (
    <div className='w-full p-4 lg:p-6 bg-[#F8FAFC]'>
      <div className="border relative border-[#E2E8F0] shadow-[0_1px_2px_-1px_rgba(0,0,0,0.1),0_1px_3px_0_rgba(0,0,0,0.1)] bg-white rounded-lg w-full h-full flex justify-center items-center">
        <Image
          width={416}
          height={200}
          src={'/images/design/png/layout.png'}
          alt='layout'
        />
        <div className="border absolute top-4 left-4 bg-white border-[#E2E8F0] rounded-lg shadow-[0_2px_4px_-2px_rgba(0,0,0,0.1),0_4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="p-3">
            <Icons icon='zoomin' />
          </div>
          <div className='border-y p-3 border-[#E2E8F0]'>
            <Icons icon='zoomout' />
          </div>
          <div className="p-3">
            <Icons icon='rotate' />
          </div>
        </div>
        <div className="border absolute flex bottom-4 bg-white right-4 border-[#E2E8F0] rounded-lg shadow-[0_2px_4px_-2px_rgba(0,0,0,0.1),0_4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="p-3">
            <Icons icon='stretue' />
          </div>
          <div className='border-s p-3 border-[#E2E8F0]'>
            <Icons icon='full' />
          </div>

        </div>
        <div className="border absolute flex top-4 py-2 px-3 items-center gap-2 bg-white right-4 border-[#E2E8F0] rounded-lg shadow-[0_2px_4px_-2px_rgba(0,0,0,0.1),0_4px_6px_-1px_rgba(0,0,0,0.1)]">
          <span className='flex w-2 h-2 bg-green rounded-full'></span>
          <Paragraph sm mainblack semibold>
            Ready
          </Paragraph>
        </div>
        <div className="absolute top-8 left-1/2 translate-x-1/2">
          <Paragraph xs medium className='text-[#64748B]!'>
            Zoom: 100%
          </Paragraph>
        </div>
      </div>
    </div>
  )
}

export default DesignLayout
