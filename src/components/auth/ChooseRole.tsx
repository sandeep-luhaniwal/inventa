"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import Paragraph from '../common/Paragraph'
import Icons from '../common/Icons'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const roleOptions = [
    {
        title: "Student",
        description: "Learn by class, subject & lectures",
        icon: "studentcap",
    },
    {
        title: "Teacher",
        description: "Create classes, manage students",
        icon: "teacher",
    },
    {
        title: "Institute",
        description: "Manage teachers, batches & reports",
        icon: "institute",
    }
]

const ChooseRole = () => {

    const [selected, setSelected] = useState(0)
    const router = useRouter()

    const handleContinue = () => {
        const selectedRole = roleOptions[selected]

        localStorage.setItem("userRole", JSON.stringify(selectedRole))
        router.push("/auth/sign-up")
    }

    return (
        <div className='max-w-120 w-full px-4 mx-auto flex justify-center items-center sm:px-0 min-h-screen py-10'>
            <div className="w-full flex flex-col gap-8 justify-center">
                <Link href={"/"} className='mx-auto max-w-max'>
                    <Image
                        src={'/images/home/png/auth-logo.png'}
                        alt='logo'
                        width={1562}
                        height={51}
                        className='w-25 sm:w-28 lg:w-39 xl:w-43'
                    />
                </Link>
                <div className="p-4 sm:p-6 lg:p-8 bg-white border border-[#E2E8F0] rounded-xl md:rounded-2xl w-full">

                    <Link href={"/auth"} className='mx-auto max-w-max'>
                        <Paragraph sm medium gray center className='flex gap-1 items-center group hover:text-blue! duration-300'>
                            <Icons icon='back' className='group-hover:stroke-blue' /> Back
                        </Paragraph>
                    </Link>

                    <Paragraph bold mainblack className='pt-3'>
                        Choose your role
                    </Paragraph>

                    <Paragraph base gray className='pt-1 pb-5'>
                        Select how you'll use Inventa
                    </Paragraph>

                    <div className="flex flex-col gap-3">

                        {roleOptions.map((obj, i) => {
                            const isActive = selected === i

                            return (
                                <div
                                    key={i}
                                    onClick={() => setSelected(i)}
                                    className={`border p-4 md:p-6 flex gap-4 items-center rounded-xl cursor-pointer transition
                                ${isActive ? "border-blue text-blue bg-[#EFF6FF]" : "border-[#E2E8F0] bg-white"}`}
                                >

                                    <div className={`w-12 h-12 rounded-xl flex justify-center items-center 
                                ${isActive ? "bg-blue text-white" : "bg-[#F8FAFC]"}`}>
                                        <Icons icon={obj.icon} className={isActive ? "stroke-white" : "stroke-blue"} />
                                    </div>

                                    <div className="flex flex-col">
                                        <Paragraph bold lg className={isActive ? "text-blue!" : "text-main-black!"}>
                                            {obj.title}
                                        </Paragraph>

                                        <Paragraph sm gray>
                                            {obj.description}
                                        </Paragraph>
                                    </div>

                                    {/* Custom Radio */}
                                    <div className="ml-auto">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center
                                        ${isActive ? "bg-blue" : "bg-white border-[#CBD5E1] border-2"}`}>
                                            {isActive && (
                                                <div className="w-2 h-2 ms-[0.8px] mb-[0.05px] bg-white rounded-full"></div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            )
                        })}

                    </div>

                    <button onClick={handleContinue} className='w-full text-sm mt-5 py-3 bg-blue text-white duration-300 hover:bg-black cursor-pointer rounded-lg font-medium'>
                        Continue
                    </button>

                </div>
            </div>
        </div>
    )
}

export default ChooseRole