// "use client"
// import React, { useState } from "react"
// import Link from "next/link"
// import Paragraph from "../common/Paragraph"
// import PhoneInput from "../common/PhoneInput"

// const SignIn = () => {
//     const [phoneNumber, setPhoneNumber] = useState("")
//     const [mobileAreaCode] = useState("IN")
//     return (
//         <div className='max-w-120 w-full px-4 mx-auto flex justify-center items-center min-h-screen py-10'>

//             <div className="p-4 sm:p-6 lg:p-8 bg-white border border-[#E2E8F0] rounded-xl md:rounded-2xl w-full">

//                 {/* Heading */}
//                 <Paragraph bold mainblack>
//                     Sign in
//                 </Paragraph>

//                 <Paragraph base gray className="pt-1 pb-5">
//                     Welcome back! Enter your mobile number
//                 </Paragraph>

//                 {/* Mobile Number */}
//                 <div className="flex flex-col gap-1.5">
//                     <label className="text-sm font-medium text-main-black">
//                         Mobile Number
//                     </label>

//                     {/* <div className="flex gap-2">
//                         <div className="flex items-center gap-2 border border-black/20 px-3 rounded-lg bg-[#F8FAFC]">
//                             <span>🇮🇳</span>
//                             <span className="text-sm font-medium">+91</span>
//                         </div>

//                         <input
//                             type="text"
//                             placeholder="Enter mobile number"
//                             className="w-full border border-black/20 placeholder:text-[#717182] font-medium rounded-lg px-4 py-3 outline-none"
//                         />
//                     </div> */}
//                     <PhoneInput
//                         value={phoneNumber}
//                         onChange={(v) => setPhoneNumber(v)}
//                         defaultCountryCode={mobileAreaCode}
//                         placeholder="Phone number"
//                     />
//                 </div>

//                 {/* Info */}
//                 <Paragraph sm medium mainblack className="pt-2.5">
//                     We'll send an OTP to verify
//                 </Paragraph>

//                 {/* Button */}
//                 <Link href="/auth/verify">
//                     <button className="w-full mt-5 text-sm py-3 bg-blue text-white rounded-lg font-medium hover:bg-black duration-300 cursor-pointer">
//                         Send OTP
//                     </button>
//                 </Link>

//                 {/* Bottom */}
//                 <Paragraph sm medium center gray className="pt-4">
//                     Don't have an account?{" "}
//                     <Link href="/auth/role">
//                         <span className="text-blue cursor-pointer">
//                             Sign Up
//                         </span>
//                     </Link>
//                 </Paragraph>

//             </div>
//         </div>
//     )
// }

// export default SignIn

"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Paragraph from "../common/Paragraph"
import PhoneInput from "../common/PhoneInput"

const SignIn = () => {
    const router = useRouter()
    const [phoneNumber, setPhoneNumber] = useState("")
    const [mobileAreaCode] = useState("IN")

    // Validation error
    const [error, setError] = useState("")

    // Loading state
    const [isLoading, setIsLoading] = useState(false)

    const validatePhoneNumber = () => {
        if (!phoneNumber.trim()) {
            setError("Mobile number is required")
            return false
        }

        // Remove all non-digits (keep only numbers)
        const digitsOnly = phoneNumber.replace(/\D/g, '')

        if (digitsOnly.length < 10) {
            setError("Please enter a valid mobile number (minimum 10 digits)")
            return false
        }

        if (digitsOnly.length > 15) {
            setError("Mobile number is too long")
            return false
        }

        setError("")
        return true
    }

    // Handle form submission
    const handleSubmit = async () => {
        if (!validatePhoneNumber()) {
            return
        }

        setIsLoading(true)

        try {
            // Store phone number for verification page
            localStorage.setItem("signinPhoneNumber", phoneNumber)

            // Simulate API call to send OTP
            // Replace this with your actual API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Navigate to verify page
            router.push("/auth/verify")

        } catch (error) {
            console.error("Signin error:", error)
            setError("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    // Handle Enter key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit()
        }
    }

    return (
        <div className='max-w-120 w-full px-4 mx-auto flex justify-center items-center min-h-screen py-10'>
            <div className="p-4 sm:p-6 lg:p-8 bg-white border border-[#E2E8F0] rounded-xl md:rounded-2xl w-full">

                {/* Heading */}
                <Paragraph bold mainblack>
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

                    <PhoneInput
                        value={phoneNumber}
                        onChange={(v) => {
                            setPhoneNumber(v)
                            if (error) setError("")
                        }}
                        defaultCountryCode={mobileAreaCode}
                        placeholder="Phone number"
                        onKeyDown={handleKeyPress}
                    />

                    {error && (
                        <p className="text-red-500 text-xs leading-none">{error}</p>
                    )}
                </div>

                {/* Info */}
                <Paragraph sm medium mainblack className="pt-2.5">
                    We'll send an OTP to verify
                </Paragraph>

                {/* Button */}
                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className={`w-full mt-5 text-sm py-3 bg-blue text-white rounded-lg font-medium hover:bg-black duration-300 cursor-pointer transition-opacity ${isLoading ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                >
                    {isLoading ? "Sending OTP..." : "Send OTP"}
                </button>

                {/* Bottom */}
                <Paragraph sm medium center gray className="pt-4">
                    Don't have an account?{" "}
                    <Link href="/auth/role">
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