import { PROJECT_OPTIONS_DATA_LIST } from '@/components/common/Helper'
import Icons from '@/components/common/Icons'
import Paragraph from '@/components/common/Paragraph'
import React from 'react'

const QuickStartProject = () => {
    return (
        <div className='py-5 lg:pb-7.5 w-full'>
            <div className="rounded-lg lg:rounded-2xl bg-linear-to-b from-[#D5E7FF] to-[#D4FFE1] p-4 md:p-6 lg:p-8">
                <Paragraph lg bold mainblack className='flex items-center gap-2'>
                    <Icons icon='starmulti' className='w-5 h-5 stroke-main-black' />
                    Quick Start
                </Paragraph>
                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {PROJECT_OPTIONS_DATA_LIST.map((obj, i) => {
                        return (
                            <div className="bg-white rounded-xl border border-[#E5E7EB] hover:border-blue p-4 md:p-6 lg:p-7" key={i}>
                                <div className="w-12 h-12 mx-auto bg-[#FEF3F2] rounded-lg flex justify-center items-center">
                                    <Icons icon={obj.icon} />
                                </div>
                                <Paragraph mainblack base medium center className='py-2'>{obj.title}</Paragraph>
                                <Paragraph gray sm medium center className='xl:max-w-50 mx-auto'>{obj.desc}</Paragraph>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default QuickStartProject
