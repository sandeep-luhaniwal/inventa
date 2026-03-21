import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import Paragraph from './Paragraph'
import Icons from './Icons'


const FOOTER_LINKS = [
    { label: "Product", href: "/" },
    { label: "Resources", href: "/" },
    { label: "Pricing", href: "/" },
    { label: "Careers", href: "/" },
    { label: "Help", href: "/" },
    { label: "Privacy", href: "/" }
]

const Footer = () => {
    const year = new Date().getFullYear()
    return (
        <div className='bg-[#002F8D] text-white'>
            <div className="max-w-330.5 px-4 mx-auto w-full pt-10 md:pt-12 lg:pt-13">

                <Link href={"/"} className='max-w-max'>
                    <Image
                        src={'/images/home/png/footer-logo.png'}
                        alt='logo'
                        width={200}
                        height={48}
                        className='w-40 sm:w-44 lg:w-50'
                    />
                </Link>

                <div className="grid grid-cols-1 md:grid-cols-2 py-10 lg:pb-12">

                    {/* Left */}
                    <div>
                        <Paragraph medium lg>
                            Made for learning & making. <br />
                            Build anything, right in your browser.
                        </Paragraph>
                        <div className="flex flex-wrap gap-4 mt-6">
                            {FOOTER_LINKS.map((link, i) => (
                                <Link key={i} href={link.href} className='text-yellow hover:text-white duration-300 text-base'>
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className='max-w-102.5 w-full md:ms-auto'>
                        <Paragraph base medium>
                            Stay Up-to-Date with the Latest 3D Design, Circuits, and Maker Insights
                        </Paragraph>
                        <div className="flex gap-3 mt-6">
                            <input
                                type="email"
                                placeholder="Email"
                                className="px-3.5 py-3 max-w-57.5 w-full rounded-md text-gray bg-white outline-none leading-none"
                            />
                            <button className="bg-yellow text-nowrap flex-nowrap hover:text-blue hover:bg-white group duration-300 font-medium px-3.5 py-3.5 lg:px-5 rounded-md text-main-black flex gap-1 cursor-pointer">
                                Sign Up <Icons icon='uparrow' className='group-hover:stroke-blue' />
                            </button>
                        </div>
                    </div>

                </div>
                <div className="border-t border-[#C7C7C7] pt-8 pb-6">
                    <Paragraph medium base>
                        © {year} Inventa. All rights reserved.
                    </Paragraph>
                </div>
            </div>
        </div>
    )
}

export default Footer