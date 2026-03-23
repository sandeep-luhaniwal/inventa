import React from 'react'
import Icons from '../common/Icons'
import { ELECTRONICS_COMPONENTS } from '../common/Helper'
import Image from 'next/image'
import Paragraph from '../common/Paragraph'

const DesignSideBar = () => {
  return (
    <div className='border-s border-[#E2E8F0] max-w-65 w-full'>
      <div className="p-4 xl:p-5 border-b border-[#E2E8F0]">
        <div className="py-2.5 max-w-2xl px-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg w-full flex items-center gap-2">
          <Icons icon='search' />
          <input type="search" placeholder='Search components...'
            className='placeholder:text-[#717182] text-sm outline-none w-full'
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        {ELECTRONICS_COMPONENTS.map((obj, i) => {
          return (
            <div key={i} className="border rounded-lg p-2.5 border-[#E2E8F0] flex flex-col justify-center items-center gap-1.5">
              <Image
                src={obj.image}
                alt='part'
                width={400}
                height={400}
                className='w-9 h-9'
              />
              <Paragraph xs center mainblack>
                {obj.title}
              </Paragraph>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DesignSideBar
