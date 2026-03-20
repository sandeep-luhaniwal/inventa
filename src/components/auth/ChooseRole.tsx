"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import Paragraph from '../common/Paragraph'
import Icons from '../common/Icons'
import { useRouter } from 'next/navigation'

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
            <div className="p-4 sm:p-6 lg:p-8 bg-white border border-[#E2E8F0] rounded-xl md:rounded-2xl lg:rounded-3xl w-full">

                <Link href={"/auth"} className='mx-auto max-w-max'>
                    <Paragraph sm medium gray center className='flex gap-1 items-center group hover:text-blue! duration-300'>
                        <Icons icon='back' className='group-hover:stroke-blue' /> Back
                    </Paragraph>
                </Link>

                <Paragraph center bold mainblack className='pt-6'>
                    Choose your role
                </Paragraph>

                <Paragraph center base gray className='pt-1 pb-5'>
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
                                ${isActive ? "border-blue text-blue" : "border-[#E2E8F0]"}`}
                            >

                                <div className={`w-12 h-12 rounded-xl flex justify-center items-center 
                                ${isActive ? "bg-blue text-white" : "bg-gray-100"}`}>
                                    <Icons icon={obj.icon} className={isActive ? "stroke-white" : "stroke-blue"} />
                                </div>

                                <div className="flex flex-col">
                                    <Paragraph bold lg className={isActive ? "text-blue!" : "text-main-black!"}>
                                        {obj.title}
                                    </Paragraph>

                                    <Paragraph sm className={isActive ? "text-blue!" : "text-gray!"}>
                                        {obj.description}
                                    </Paragraph>
                                </div>

                                {/* Custom Radio */}
                                <div className="ml-auto">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                                        ${isActive ? "border-blue" : "border-gray-400"}`}>
                                        {isActive && (
                                            <div className="w-2.5 h-2.5 bg-blue rounded-full"></div>
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
    )
}

export default ChooseRole