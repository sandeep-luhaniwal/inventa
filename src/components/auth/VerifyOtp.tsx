"use client"
import React, { useEffect, useRef, useState } from "react"
import Paragraph from "../common/Paragraph"
import Link from "next/link"
import { useRouter } from "next/navigation"

const VerifyOtp = () => {
    const [otp, setOtp] = useState(["", "", "", "", "", ""])
    const inputsRef = useRef<(HTMLInputElement | null)[]>([])
    const [timer, setTimer] = useState(28)
    const [isExpired, setIsExpired] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const correctOtp = "123456" // 🔥 change with API later

    // Timer
    useEffect(() => {
        if (timer === 0) {
            setIsExpired(true)
            return
        }
        const interval = setInterval(() => {
            setTimer((prev) => prev - 1)
        }, 1000)

        return () => clearInterval(interval)
    }, [timer])

    // Handle input
    const handleChange = (value: string, index: number) => {
        if (!/^[0-9]?$/.test(value)) return

        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)
        setError("")

        if (value && index < 5) {
            inputsRef.current[index + 1]?.focus()
        }
    }

    // Backspace
    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputsRef.current[index - 1]?.focus()
        }
    }

    const handleVerify = async () => {
        const enteredOtp = otp.join("")

        if (enteredOtp.length < 6) {
            setError("Please enter complete OTP")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            // 🔥 simulate API call (replace with real API)
            await new Promise((resolve) => setTimeout(resolve, 1500))

            if (enteredOtp !== correctOtp) {
                setError("Incorrect OTP")
                return
            }

            // ✅ success
            router.push("/dashboard")

        } catch (err) {
            setError("Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    // Resend OTP
    const handleResend = () => {
        setTimer(28)
        setIsExpired(false)
        setOtp(["", "", "", "", "", ""])
        setError("")
        inputsRef.current[0]?.focus()
    }

    return (
        <div className='max-w-120 w-full px-4 mx-auto flex justify-center items-center sm:px-0 min-h-screen py-10'>
            <div className="p-4 sm:p-6 lg:p-8 bg-white border border-[#E2E8F0] rounded-xl md:rounded-2xl w-full text-center">

                {/* Heading */}
                <Paragraph bold center mainblack>
                    Verify OTP
                </Paragraph>

                <Paragraph center base gray className="pt-1">
                    OTP sent to +91 ******1234
                </Paragraph>

                {/* OTP Inputs */}
                <div className="flex justify-center gap-3 mt-6">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => {
                                inputsRef.current[index] = el
                            }}
                            type="text"
                            value={digit}
                            maxLength={1}
                            onChange={(e) => handleChange(e.target.value, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className={`w-12 h-12 sm:h-14 text-center text-lg font-semibold border rounded-xl outline-none 
                            ${error ? "border-red-500" : "border-black/20"} focus:border-blue`}
                        />
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <p className="text-red-500 text-sm mt-2">{error}</p>
                )}

                {/* Timer / Resend */}
                {!isExpired ? (
                    <Paragraph center sm medium black className="mt-5">
                        Resend OTP in 00:{timer < 10 ? `0${timer}` : timer}
                    </Paragraph>
                ) : (
                    <button
                        onClick={handleResend}
                        className="text-blue text-sm font-medium mt-5 cursor-pointer"
                    >
                        Resend OTP
                    </button>
                )}

                {/* Change number */}
                <Link href="/auth/sign-up">
                    <Paragraph center sm medium blue className="mt-1 cursor-pointer">
                        Change number
                    </Paragraph>
                </Link>

                <button
                    onClick={handleVerify}
                    disabled={isLoading}
                    className={`w-full mt-6 text-sm py-3 bg-blue text-white rounded-lg font-medium transition-all duration-300 
                    hover:shadow-lg ${isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-black cursor-pointer"}`}
                >
                    {isLoading ? "Verifying..." : "Verify & Continue"}
                </button>

            </div>
        </div>
    )
}

export default VerifyOtp