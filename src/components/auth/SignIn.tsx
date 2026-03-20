"use client"
import React from "react"
import Link from "next/link"
import Paragraph from "../common/Paragraph"

const SignIn = () => {
    return (
        <div className='max-w-120 w-full px-4 mx-auto flex justify-center items-center min-h-screen py-10'>

            <div className="p-4 sm:p-6 lg:p-8 bg-white border border-[#E2E8F0] rounded-xl md:rounded-2xl lg:rounded-3xl w-full">

                {/* Heading */}
                <Paragraph bold lg mainblack>
                    Sign in
                </Paragraph>

                <Paragraph base gray className="pt-1 pb-5">
                    Welcome back! Enter your mobile number
                </Paragraph>

                {/* Mobile Number */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-main-black">
                        Mobile Number
                    </label>

                    <div className="flex gap-2">
                        {/* Country Code */}
                        <div className="flex items-center gap-2 border border-black/20 px-3 rounded-lg bg-[#F8FAFC]">
                            <span>🇮🇳</span>
                            <span className="text-sm font-medium">+91</span>
                        </div>

                        {/* Input */}
                        <input
                            type="text"
                            placeholder="Enter mobile number"
                            className="w-full border border-black/20 placeholder:text-[#717182] font-medium rounded-lg px-4 py-3 outline-none"
                        />
                    </div>
                </div>

                {/* Info */}
                <Paragraph sm medium mainblack className="pt-3">
                    We'll send an OTP to verify
                </Paragraph>

                {/* Button */}
                <Link href="/auth/verify">
                    <button className="w-full mt-5 text-sm py-3 bg-blue text-white rounded-lg font-medium hover:bg-black duration-300 cursor-pointer">
                        Send OTP
                    </button>
                </Link>

                {/* Bottom */}
                <Paragraph sm medium center gray className="pt-4">
                    Don't have an account?{" "}
                    <Link href="/auth/sign-up">
                        <span className="text-blue cursor-pointer">
                            Sign Up
                        </span>
                    </Link>
                </Paragraph>

            </div>
        </div>
    )
}

export default SignIn