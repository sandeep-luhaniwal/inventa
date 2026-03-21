import React from 'react'
import Icons from '../common/Icons'
import { TOOLBAR_ITEMS } from '../common/Helper'
import Paragraph from '../common/Paragraph'

const StyleLayout = () => {
    return (
        <div className='border-y border-[#E2E8F0] bg-[#F8FAFC] py-2.5 px-4 xl:px-6 flex items-center justify-between gap-10'>
            <div className="flex gap-2 items-center">
                {TOOLBAR_ITEMS.map((item, index) => {
                    if (item.type === "divider") {
                        return (
                            <div
                                key={index}
                                className="w-px h-6 bg-[#E2E8F0] mx-1"
                            />
                        )
                    }
                    return (
                        <button
                            key={index}
                            className='w-9 h-9 duration-300 hover:bg-white rounded flex justify-center items-center'
                        >
                            <Icons icon={item.icon ?? ''} />
                        </button>
                    )
                })}
            </div>
            <div className="flex items-center justify-end gap-3 w-full">
                <Paragraph base bold mainblack>
                    Filters
                </Paragraph>
                <div className="py-2 px-3 text-sm gap-1 font-bold text-[#717182] cursor-pointer rounded-lg flex border justify-between max-w-54 w-full border-[#E2E8F0]">
                    Select subject
                    <Icons icon='downarrow' />
                </div>
                <div className="py-2 px-3 text-sm gap-1 font-bold text-[#717182] cursor-pointer rounded-lg flex border justify-between max-w-54 w-full border-[#E2E8F0]">
                  Select Lecture
                    <Icons icon='downarrow' />
                </div>
            </div>
        </div>
    )
}

export default StyleLayout
