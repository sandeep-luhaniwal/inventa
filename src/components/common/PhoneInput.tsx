"use client"
import React, { useEffect, useRef, useState } from 'react'
import Icons from './Icons'

interface CountryCode {
  code: string
  dialCode: string
  name: string
  flag: string
}

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  defaultCountryCode?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

const COUNTRY_CODES: CountryCode[] = [
  { code: "GB", dialCode: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "US", dialCode: "+1", name: "United States", flag: "🇺🇸" },
  { code: "IN", dialCode: "+91", name: "India", flag: "🇮🇳" },
  { code: "AE", dialCode: "+971", name: "UAE", flag: "🇦🇪" },
  { code: "SA", dialCode: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "EG", dialCode: "+20", name: "Egypt", flag: "🇪🇬" },
  { code: "FR", dialCode: "+33", name: "France", flag: "🇫🇷" },
  { code: "DE", dialCode: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "IT", dialCode: "+39", name: "Italy", flag: "🇮🇹" },
  { code: "ES", dialCode: "+34", name: "Spain", flag: "🇪🇸" },
  { code: "PT", dialCode: "+351", name: "Portugal", flag: "🇵🇹" },
  { code: "NL", dialCode: "+31", name: "Netherlands", flag: "🇳🇱" },
  { code: "BE", dialCode: "+32", name: "Belgium", flag: "🇧🇪" },
  { code: "CH", dialCode: "+41", name: "Switzerland", flag: "🇨🇭" },
  { code: "AT", dialCode: "+43", name: "Austria", flag: "🇦🇹" },
  { code: "SE", dialCode: "+46", name: "Sweden", flag: "🇸🇪" },
  { code: "NO", dialCode: "+47", name: "Norway", flag: "🇳🇴" },
  { code: "DK", dialCode: "+45", name: "Denmark", flag: "🇩🇰" },
  { code: "FI", dialCode: "+358", name: "Finland", flag: "🇫🇮" },
  { code: "PL", dialCode: "+48", name: "Poland", flag: "🇵🇱" },
  { code: "RU", dialCode: "+7", name: "Russia", flag: "🇷🇺" },
  { code: "CN", dialCode: "+86", name: "China", flag: "🇨🇳" },
  { code: "JP", dialCode: "+81", name: "Japan", flag: "🇯🇵" },
  { code: "KR", dialCode: "+82", name: "South Korea", flag: "🇰🇷" },
  { code: "SG", dialCode: "+65", name: "Singapore", flag: "🇸🇬" },
  { code: "MY", dialCode: "+60", name: "Malaysia", flag: "🇲🇾" },
  { code: "TH", dialCode: "+66", name: "Thailand", flag: "🇹🇭" },
  { code: "VN", dialCode: "+84", name: "Vietnam", flag: "🇻🇳" },
  { code: "ID", dialCode: "+62", name: "Indonesia", flag: "🇮🇩" },
  { code: "PH", dialCode: "+63", name: "Philippines", flag: "🇵🇭" },
  { code: "AU", dialCode: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "NZ", dialCode: "+64", name: "New Zealand", flag: "🇳🇿" },
  { code: "ZA", dialCode: "+27", name: "South Africa", flag: "🇿🇦" },
  { code: "BR", dialCode: "+55", name: "Brazil", flag: "🇧🇷" },
  { code: "MX", dialCode: "+52", name: "Mexico", flag: "🇲🇽" },
  { code: "CA", dialCode: "+1", name: "Canada", flag: "🇨🇦" },
]

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  defaultCountryCode = "IN",
  placeholder = "Phone number",
  className = "",
  disabled = false,
  onKeyDown,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | null>(null)
  const [localNumber, setLocalNumber] = useState("")
  const [openUpward, setOpenUpward] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Parse the value into dial code and number
  useEffect(() => {
    if (value) {
      const matchedCountry = COUNTRY_CODES.find(country => 
        value.startsWith(country.dialCode)
      )
      if (matchedCountry) {
        setSelectedCountry(matchedCountry)
        const number = value.slice(matchedCountry.dialCode.length)
        setLocalNumber(number)
      } else if (selectedCountry) {
        // If no match but we have a selected country, treat as number only
        setLocalNumber(value)
      } else {
        // Default to selected or default country
        const defaultCountry = COUNTRY_CODES.find(c => c.code === defaultCountryCode) || COUNTRY_CODES[0]
        setSelectedCountry(defaultCountry)
        setLocalNumber(value)
      }
    } else {
      const defaultCountry = COUNTRY_CODES.find(c => c.code === defaultCountryCode) || COUNTRY_CODES[0]
      setSelectedCountry(defaultCountry)
      setLocalNumber("")
    }
  }, [value, defaultCountryCode])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle number change
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value
    // Only allow digits and maybe a plus at the start
    const cleanedNumber = newNumber.replace(/[^\d]/g, '')
    setLocalNumber(cleanedNumber)
    
    // Format the full phone number
    if (selectedCountry) {
      const fullNumber = `${selectedCountry.dialCode}${cleanedNumber}`
      onChange(fullNumber)
    } else {
      onChange(cleanedNumber)
    }
  }

  // Handle country selection
  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country)
    setIsOpen(false)
    
    // Update the full number with new dial code
    const fullNumber = `${country.dialCode}${localNumber}`
    onChange(fullNumber)
  }

  // Format phone number for display
  const formatPhoneNumber = (number: string) => {
    if (!number) return ''
    // Simple formatting: group by 3-4 digits
    const groups = number.match(/.{1,3}/g)
    return groups ? groups.join(' ') : number
  }

  return (
    <div className={`relative flex gap-2 rounded-lg overflow-visible ${className}`} ref={dropdownRef}>
      {/* Country Code Dropdown */}
      <div className="relative">
        <button
          type="button"
          className="h-full px-3 flex items-center gap-1.5 border border-[#E2E8F0] bg-white rounded-lg cursor-pointer"
          onClick={() => {
            if (!isOpen && buttonRef.current) {
              const rect = buttonRef.current.getBoundingClientRect()
              const spaceBelow = window.innerHeight - rect.bottom
              setOpenUpward(spaceBelow < 320)
            }
            setIsOpen(!isOpen)
          }}
          ref={buttonRef}
          disabled={disabled}
        >
          {selectedCountry && (
            <>
              <span className="text-xl">{selectedCountry.flag}</span>
              <span className="text-sm font-medium text-gray-700">{selectedCountry.dialCode}</span>
              {/* <span className="text-gray-400 text-xs">▼</span> */}
              <Icons icon='downarrow' className='stroke-[#717182] opacity-80' />
            </>
          )}
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className={`absolute left-0 w-72 bg-white border border-[#e5e7eb] rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto ${openUpward ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
            <div className="sticky top-0 bg-white p-2 border-b border-[#e5e7eb]">
              <input
                type="text"
                placeholder="Search country..."
                className="w-full h-8 px-2 text-sm border border-[#e5e7eb] rounded outline-none"
                onChange={(e) => {
                  const searchTerm = e.target.value.toLowerCase()
                  const items = document.querySelectorAll('.country-item')
                  items.forEach(item => {
                    const text = item.textContent?.toLowerCase() || ''
                    item.classList.toggle('hidden', !text.includes(searchTerm))
                  })
                }}
              />
            </div>
            {COUNTRY_CODES.map((country) => (
              <div
                key={country.code}
                className="country-item px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                onClick={() => handleCountrySelect(country)}
              >
                <span className="text-xl">{country.flag}</span>
                <span className="text-sm font-medium">{country.dialCode}</span>
                <span className="text-sm text-gray-600">{country.name}</span>
                {selectedCountry?.code === country.code && (
                  <span className="ml-auto text-blue">✓</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phone Number Input */}
      <input
        type="tel"
        value={formatPhoneNumber(localNumber)}
        onChange={handleNumberChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full border placeholder:text-[#717182] font-medium border-black/30 rounded-lg px-4 py-3 outline-none flex-1"
      />
    </div>
  )
}

export default PhoneInput