import React, { ReactNode } from 'react'
import Link from 'next/link';
import Icons from '../common/Icons';

type MainButtonProps = {
    children: ReactNode,
    onClick?: () => void,
    disabled?: boolean,
    className?: string,
    url?: string,
    target?: string,
    icon?: string,
    iconClass?: string,
    type?: 'button' | 'submit' | 'reset',
    blue?: boolean,
    light?: boolean,
    normal?: boolean,
    medium?: boolean,
    semibold?: boolean,
    extrabold?: boolean,
    yellow?: boolean,
}
const MainButton: React.FC<MainButtonProps> = ({ children, disabled = false, className, onClick, url, target, type, icon, iconClass, blue, light, medium, semibold, normal, extrabold, yellow }) => {
    return (
        <>
            {url ? (
                <Link href={url} target={target} className={`${blue ? "text-white bg-blue hover:bg-white hover:text-blue" : "bg-white text-light-black hover:bg-blue hover:text-white"}
                         ${light ? "font-light" : medium ? "font-medium" : semibold ? "font-semibold" : normal ? "font-normal" : extrabold ? "font-extrabold" : "font-bold"}
                        py-2.5 px-4 md:py-3.5 md:px-6 lg:py-4.5 lg:px-8 rounded-full text-base md:text-lg group flex items-center justify-center gap-1.5 border border-transparent duration-300 hover:duration-300 transition-all cursor-pointer max-w-max
                       ${className}`}>
                    {children}
                    {icon && <Icons icon={icon} className={`${iconClass} group-hover:translate-x-0.5 duration-300`} />}
                </Link>
            ) :
                (
                    <button onClick={!disabled ? onClick : undefined} type={type}
                        disabled={disabled} className={`${blue ? "text-white bg-blue hover:bg-white hover:text-blue" : yellow ? "bg-yellow text-main-black hover:bg-white hover:text-blue" : "bg-white text-light-black hover:bg-blue hover:text-white"}
                         ${light ? "font-light" : medium ? "font-medium" : semibold ? "font-semibold" : normal ? "font-normal" : extrabold ? "font-extrabold" : "font-bold"}
                        py-2.5 px-4 md:py-3.5 md:px-6 lg:py-4.5 lg:px-8 rounded-full text-base md:text-lg group flex items-center justify-center gap-1.5 border border-transparent duration-300 hover:duration-300 transition-all cursor-pointer max-w-max
                       ${className}`}>
                        {children}
                        {icon && <Icons icon={icon} className={`${iconClass} group-hover:translate-x-0.5 duration-300`} />}
                    </button>
                )}
        </>
    )
}

export default MainButton