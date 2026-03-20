import React from 'react'

interface ParagraphProps {
    children: React.ReactNode,
    xs?: boolean,
    sm?: boolean,
    base?: boolean,
    lg?: boolean,
    xl?: boolean,
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
    gray?: boolean,
    green?: boolean,
    lightgray?: boolean,
    blue?: boolean,
    offblack?: boolean,
}
const Paragraph: React.FC<ParagraphProps> = ({ children, xs, sm, base, lg, xl, light, medium, semibold, bold, extrabold, center, right, className, black, mainblack, gray, green, lightgray, blue, offblack }) => {
    return (
        <p className={`${xs ? 'text-xs' : sm ? 'text-sm' : base ? 'text-sm md:text-base' : lg ? 'text-[15px] md:text-base lg:text-lg' : xl ? 'text-base md:text-lg lg:text-xl' : "text-lg md:text-xl lg:text-2xl"}
        ${light ? "font-light" : medium ? "font-medium" : semibold ? "font-semibold" : bold ? "font-bold" : extrabold ? "font-extrabold" : "font-normal"}
         ${center ? "mx-auto text-center" : right ? "text-right ms-auto" : "text-left"} leading-[160%]
         ${className} ${black ? "text-black" : mainblack ? "text-main-black" : gray ? "text-gray" : green ? "text-green" : lightgray ? "text-light-gray" : offblack ? "text-offblack" : blue ? "text-blue" : "text-white"}
        `}>
            {children}
        </p>
    )
}

export default Paragraph
