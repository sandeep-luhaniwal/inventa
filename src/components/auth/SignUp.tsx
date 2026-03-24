"use client"
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Paragraph from '../common/Paragraph'
import Icons from '../common/Icons'
import Image from 'next/image'
import PhoneInput from '../common/PhoneInput'

const roles = ["Student", "Teacher", "Institute"]

const SignUp = () => {
    const router = useRouter()
    const [checked, setChecked] = useState(false)
    const [selectedRole, setSelectedRole] = useState("Student")
    const [open, setOpen] = useState(false)
    const [phoneNumber, setPhoneNumber] = useState("")
    const [mobileAreaCode] = useState("IN")

    // Form fields state
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")

    // Validation errors
    const [errors, setErrors] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
        terms: ""
    })

    // Loading state
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const stored = localStorage.getItem("userRole")
        if (stored) {
            const parsed = JSON.parse(stored)
            setSelectedRole(parsed.title)
        }
    }, [])

    const options = roles.filter(role => role !== selectedRole)

    const handleSelect = (role: string) => {
        setSelectedRole(role)
        setOpen(false)
        localStorage.setItem("userRole", JSON.stringify({ title: role }))
    }

    // Validation function
    const validateForm = () => {
        let isValid = true
        const newErrors = {
            fullName: "",
            email: "",
            phoneNumber: "",
            terms: ""
        }

        // Full Name validation
        if (!fullName.trim()) {
            newErrors.fullName = "Full name is required"
            isValid = false
        } else if (fullName.trim().length < 2) {
            newErrors.fullName = "Name must be at least 2 characters"
            isValid = false
        }

        // Email validation
        const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/
        if (!email.trim()) {
            newErrors.email = "Email address is required"
            isValid = false
        } else if (!emailRegex.test(email)) {
            newErrors.email = "Please enter a valid email address"
            isValid = false
        }

        // Phone number validation
        if (!phoneNumber.trim()) {
            newErrors.phoneNumber = "Mobile number is required"
            isValid = false
        } else if (phoneNumber.length < 10) {
            newErrors.phoneNumber = "Please enter a valid mobile number"
            isValid = false
        }

        // Terms validation
        if (!checked) {
            newErrors.terms = "You must agree to the Terms & Conditions and Privacy Policy"
            isValid = false
        }

        setErrors(newErrors)
        return isValid
    }

    // Handle form submission
    const handleSubmit = async () => {
        if (!validateForm()) {
            return
        }

        setIsLoading(true)

        try {
            // Store user data in localStorage or session
            const userData = {
                fullName: fullName.trim(),
                email: email.trim(),
                phoneNumber: phoneNumber,
                role: selectedRole,
                timestamp: new Date().toISOString()
            }

            // Save to localStorage for verification page
            localStorage.setItem("signupData", JSON.stringify(userData))

            // Simulate API call (replace with actual API call)
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Navigate to verify page
            router.push("/auth/verify")

        } catch (error) {
            console.error("Signup error:", error)
            setErrors({
                ...errors,
                email: "Something went wrong. Please try again."
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit()
        }
    }

    return (
        <div className='max-w-120 w-full px-4 mx-auto flex justify-center items-center min-h-screen py-10'>
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

                    <Link href={"/auth/role"} className='max-w-max'>
                        <Paragraph sm medium gray center className='flex gap-1 items-center group hover:text-blue! duration-300'>
                            <Icons icon='back' className='group-hover:stroke-blue' /> Back
                        </Paragraph>
                    </Link>
                    <Paragraph bold mainblack className='pt-4'>
                        Create your account
                    </Paragraph>

                    <Paragraph base gray className='pt-1 pb-5'>
                        Enter your mobile number to get started
                    </Paragraph>
                    <div className="relative">
                        <div className="flex justify-between items-center bg-[#EFF6FF] border border-[#2563EB]/20 px-4 py-3 rounded-lg">
                            <Paragraph sm blue medium>
                                {selectedRole}
                            </Paragraph>
                            <button
                                onClick={() => setOpen(!open)}
                                className='text-blue text-sm font-medium cursor-pointer'
                            >
                                Change
                            </button>
                        </div>
                        <div className={`overflow-hidden absolute top-13 w-full transition-all duration-300 ${open ? "max-h-40" : "max-h-0"}`}>
                            <div className="bg-white border border-[#E2E8F0] rounded-lg shadow">
                                {options.map((role, i) => (
                                    <div
                                        key={i}
                                        onClick={() => handleSelect(role)}
                                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                    >
                                        {role}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 flex flex-col gap-4">
                        <div className='flex flex-col gap-1.5'>
                            <label htmlFor="name" className='text-sm font-medium text-main-black'>Full Name</label>
                            <input
                                type="text"
                                placeholder="Enter your full name"
                                value={fullName}
                                onChange={(e) => {
                                    setFullName(e.target.value)
                                    if (errors.fullName) setErrors({ ...errors, fullName: "" })
                                }}
                                onKeyDown={handleKeyPress}
                                className={`w-full border placeholder:text-[#717182] font-medium rounded-lg px-4 py-3 outline-none transition-colors ${errors.fullName
                                        ? "border-red-500 focus:border-red-500"
                                        : "border-black/30 focus:border-blue"
                                    }`}
                            />
                            {errors.fullName && (
                                <p className="text-red-500 text-xs leading-none">{errors.fullName}</p>
                            )}
                        </div>
                        <div className='flex flex-col gap-1.5'>
                            <label htmlFor="email" className='text-sm font-medium text-main-black'>Email Address</label>
                            <input
                                type="email"
                                placeholder="you@institution.edu"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                    if (errors.email) setErrors({ ...errors, email: "" })
                                }}
                                onKeyDown={handleKeyPress}
                                className={`w-full border placeholder:text-[#717182] font-medium rounded-lg px-4 py-3 outline-none transition-colors ${errors.email
                                        ? "border-red-500 focus:border-red-500"
                                        : "border-black/30 focus:border-blue"
                                    }`}
                            />
                            {errors.email && (
                                <p className="text-red-500 text-xs leading-none">{errors.email}</p>
                            )}
                        </div>
                        <div className='flex flex-col gap-1.5'>
                            <label htmlFor="phone" className='text-sm font-medium text-main-black'>Mobile Number</label>
                            <PhoneInput
                                value={phoneNumber}
                                onChange={(v) => {
                                    setPhoneNumber(v)
                                    if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: "" })
                                }}
                                defaultCountryCode={mobileAreaCode}
                                placeholder="Phone number"
                            />
                            {errors.phoneNumber && (
                                <p className="text-red-500 text-xs leading-none">{errors.phoneNumber}</p>
                            )}
                        </div>
                    </div>
                    <Paragraph sm medium mainblack className='pt-2'>
                        We&apos;ll send an OTP to verify
                    </Paragraph>
                    <div className="flex items-center gap-2 my-4">
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                                setChecked(!checked)
                                if (errors.terms) setErrors({ ...errors, terms: "" })
                            }}
                            className='accent-black'
                        />
                        <Paragraph sm medium gray>
                            I agree to the{" "}
                            <span className="text-blue">Terms & Conditions</span>{" "}
                            and{" "}
                            <span className="text-blue">Privacy Policy</span>
                        </Paragraph>
                    </div>
                    {errors.terms && (
                        <p className="text-red-500 text-xs -mt-4 mb-4">{errors.terms}</p>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className={`w-full text-sm py-3 bg-blue text-white duration-300 hover:bg-black cursor-pointer rounded-lg font-medium transition-opacity ${isLoading ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                    >
                        {isLoading ? "Sending OTP..." : "Send OTP"}
                    </button>
                    <Paragraph sm medium center gray className='pt-4'>
                        Already have an account?{" "}
                        <Link href={"/auth/sign-in"} className="text-blue cursor-pointer">Sign in</Link>
                    </Paragraph>

                </div>
            </div>
        </div>
    )
}

export default SignUp
