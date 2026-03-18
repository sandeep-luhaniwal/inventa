import React from 'react'

interface HeadingProps {
    children: React.ReactNode,
    small?: boolean,
    big?: boolean,
    light?: boolean,
    medium?: boolean,
    semibold?: boolean,
    bold?: boolean,
    extrabold?: boolean,
    center?: boolean,
    right?: boolean,
    className?: string,
    black?: boolean,
    mainblack?: boolean,
}
const Heading: React.FC<HeadingProps> = ({ children, small, big, light, medium, semibold, bold, extrabold, center, right, className, black, mainblack }) => {
    return (
        <h2 className={`${small ? 'text-2xl md:text-[26px] lg:text-[28px]' : big ? "text-4xl md:text-5xl lg:text-[52px]" : "text-[32px] md:text-[38px] lg:text-[42px]"}
        ${light ? "font-light" : medium ? "font-medium" : semibold ? "font-semibold" : bold ? "font-bold" : extrabold ? "font-extrabold" : "font-normal"}
         ${center ? "mx-auto text-center" : right ? "text-right ms-auto" : "text-left"} leading-[114%]
          ${className} ${black ? "text-black" : mainblack ? "text-main-black" : "text-white"}
        `}>
            {children}
        </h2>
    )
}


export default Heading
