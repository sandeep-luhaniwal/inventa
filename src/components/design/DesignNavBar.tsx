import React from 'react'
import Paragraph from '../common/Paragraph'
import Image from 'next/image'
import Icons from '../common/Icons'

const DesignNavBar = () => {
    return (
        <div className='w-full bg-[#0F172A] px-4 lg:px-6 py-2 lg:py-3 shadow-[0_4px_6px_-4px_rgba(0,0,0,0.1),0_10px_15px_-3px_rgba(0,0,0,0.1)]'>
            <div className="flex justify-between gap-10">
                <div className="flex items-center gap-12 w-full">
                    <div className="flex items-center gap-4">

                        <Image
                            src={'/images/home/png/footer-logo.png'}
                            alt='logo'
                            width={156}
                            height={38}
                            className='w-25 sm:w-28'
                        />
                        <div className='w-px h-5 bg-gray block' />
                        <Paragraph sm gray medium>
                            Circuit Simulator
                        </Paragraph>
                    </div>
                    <div className="py-2 px-4 max-w-md bg-[#1E293B] border-gray rounded-lg w-full border">
                        <Paragraph xs>
                            My LED Circuit
                        </Paragraph>
                    </div>
                </div>
                <div className="flex justify-end gap-3 items-center">
                    <button className='cursor-pointer flex items-center gap-2 border border-gray py-2 px-4 rounded-lg text-white text-sm font-medium flex-nowrap text-nowrap'>
                        <Icons icon='save' />
                        Save
                    </button>
                    <button className='cursor-pointer flex items-center gap-2 border bg-blue border-blue py-2 px-4 rounded-lg text-white text-sm font-medium flex-nowrap text-nowrap'>
                        <Icons icon='play' />
                        Run Simulation
                    </button>
                    <button className='cursor-pointer flex items-center gap-2 border border-gray py-2 px-4 rounded-lg text-white text-sm font-medium flex-nowrap text-nowrap'>
                        <Icons icon='export' />
                        Export
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DesignNavBar
