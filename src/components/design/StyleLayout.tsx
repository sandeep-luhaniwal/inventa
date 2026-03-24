"use client"
import React, { useRef, useState } from 'react'
import Icons from '../common/Icons'
import { TOOLBAR_ITEMS } from '../common/Helper'
import Paragraph from '../common/Paragraph'

const SUBJECTS = ["Mathematics", "Science", "English", "Hindi", "Social Science", "Sanskrit"]
const LECTURES = ["Chapter 1", "Chapter 2", "Chapter 3", "Chapter 4", "Chapter 5"]

const StyleLayout = () => {
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
    const [selectedLecture, setSelectedLecture] = useState<string | null>(null)
    const [openSubject, setOpenSubject] = useState(false)
    const [openLecture, setOpenLecture] = useState(false)
    const subjectRef = useRef<HTMLDivElement>(null)
    const lectureRef = useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (subjectRef.current && !subjectRef.current.contains(e.target as Node)) setOpenSubject(false)
            if (lectureRef.current && !lectureRef.current.contains(e.target as Node)) setOpenLecture(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])
    return (
        <div className='border-y border-[#E2E8F0] bg-[#F8FAFC] py-2.5 px-4 xl:px-6 flex items-center justify-between gap-10'>
            <div className="flex gap-2 items-center">
                {TOOLBAR_ITEMS.map((item, index) => {
                    if (item.type === "divider") {
                        return (
                            <div
                                key={index}
                                className="w-px h-6 bg-[#E2E8F0] mx-1"
                            />
                        )
                    }
                    return (
                        <button
                            key={index}
                            className='w-9 h-9 duration-300 hover:bg-white rounded-lg flex justify-center items-center'
                        >
                            <Icons icon={item.icon ?? ''} />
                        </button>
                    )
                })}
            </div>
            <div className="flex items-center justify-end gap-3 w-full">
                <Paragraph base bold mainblack>
                    Filters
                </Paragraph>
                <div className="relative" ref={subjectRef}>
                    <div onClick={() => { setOpenSubject(!openSubject); setOpenLecture(false) }} className="py-2 px-3 text-sm gap-1 font-medium text-[#717182] cursor-pointer rounded-lg flex border justify-between max-w-54 w-full border-[#E2E8F0]">
                        {selectedSubject || 'Select subject'}
                        <Icons icon='downarrow' />
                    </div>
                    {openSubject && (
                        <div className="absolute top-full right-0 mt-1 w-54 bg-white border border-[#E2E8F0] rounded-lg shadow-lg z-50 max-h-52 overflow-y-auto">
                            {SUBJECTS.map((s, i) => (
                                <div key={i} onClick={() => { setSelectedSubject(s); setOpenSubject(false) }}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${selectedSubject === s ? 'text-blue font-medium' : 'text-[#717182]'}`}>
                                    {s}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="relative" ref={lectureRef}>
                    <div onClick={() => { setOpenLecture(!openLecture); setOpenSubject(false) }} className="py-2 px-3 text-sm gap-1 font-medium text-[#717182] cursor-pointer rounded-lg flex border justify-between max-w-54 w-full border-[#E2E8F0]">
                        {selectedLecture || 'Select Lecture'}
                        <Icons icon='downarrow' />
                    </div>
                    {openLecture && (
                        <div className="absolute top-full right-0 mt-1 w-54 bg-white border border-[#E2E8F0] rounded-lg shadow-lg z-50 max-h-52 overflow-y-auto">
                            {LECTURES.map((l, i) => (
                                <div key={i} onClick={() => { setSelectedLecture(l); setOpenLecture(false) }}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${selectedLecture === l ? 'text-blue font-medium' : 'text-[#717182]'}`}>
                                    {l}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default StyleLayout
