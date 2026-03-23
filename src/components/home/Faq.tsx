"use client"
import React, { useEffect, useRef, useState } from 'react'
import Heading from '../common/Heading'
import Paragraph from '../common/Paragraph'
import Image from 'next/image'
import Icons from '../common/Icons'
import { FAQS_DATA_LIST } from '../common/Helper'

const Faq = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    // FIX: Recalculate height whenever openIndex changes
    useEffect(() => {
        if (openIndex !== null && contentRefs.current[openIndex]) {
            const el = contentRefs.current[openIndex];
            el.style.maxHeight = el.scrollHeight + "px";
        }

        // Close others
        contentRefs.current.forEach((el, i) => {
            if (!el) return;
            if (i !== openIndex) {
                el.style.maxHeight = "0px";
            }
        });
    }, [openIndex]);
    return (
        <div className="overflow-clip">
            <div className='relative max-w-360 mx-auto w-full'>
                <span className='block w-102 h-102 rounded-full absolute top-45 left-0 bg-yellow blur-[310px]'></span>
                <span className='block w-100 h-100 rounded-full absolute top-20 right-0 bg-[#4F39F6] blur-[310px]'></span>
                <div className="max-w-330.5 px-4 mx-auto w-full py-14 md:py-16 lg:pt-20 relative z-10">
                    <Heading bold mainblack>
                        Frequently asked questions
                    </Heading>
                    <Paragraph xl gray className='pt-1'>
                        Everything you need to know about Learn 3D.
                    </Paragraph>
                    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-2 gap-6 pt-10">
                        <div className="sm:col-span-2 md:col-span-1 order-2 sm:order-1">
                            <div className="space-y-4">
                                {FAQS_DATA_LIST.map((faq, index) => {
                                    const isActive = openIndex === index;

                                    return (
                                        <div
                                            key={index}
                                            className="bg-white p-4 lg:p-9 shadow-[0px_24.56px_32.74px_-14.73px_rgba(149,149,149,0.25)] rounded"
                                        >
                                            <div onClick={() => toggleFAQ(index)} className="flex cursor-pointer justify-between items-center">
                                                <Paragraph bold mainblack lg className="flex items-center gap-8">
                                                    <span
                                                        className={`relative z-10 transition-all duration-700`}
                                                    >
                                                        <Icons icon={isActive ? "nagtive" : "add"}
                                                        />
                                                    </span>
                                                    {faq.question}
                                                </Paragraph>


                                            </div>

                                            {/* FIXED CONTENT HEIGHT */}
                                            <div
                                                ref={(el) => {
                                                    contentRefs.current[index] = el;
                                                }}
                                                className="overflow-hidden transition-all pl-12 duration-500 ease-in-out"
                                                style={{ maxHeight: index === openIndex ? "auto" : "0px" }}
                                            >
                                                <Paragraph mainblack base className="mt-2">
                                                    {faq.answer}
                                                </Paragraph>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex justify-center items-center order-1 sm:order-2">
                            <Image
                                src={'/images/home/png/faq-img.png'}
                                width={3554}
                                height={3554}
                                alt='faq'
                                className='max-w-88.5 w-full'
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Faq
