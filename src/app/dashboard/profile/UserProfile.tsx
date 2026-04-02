import Paragraph from '@/components/common/Paragraph'
import React, { useEffect, useRef } from 'react'

interface UserProfileProps {
    onClose?: () => void;
}
const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef?.current &&
                !dropdownRef?.current?.contains(event?.target as Node)
            ) {
                onClose?.();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);
    
    return (
        <div ref={dropdownRef} className='border border-offgray bg-white w-40 rounded-lg overflow-clip flex flex-col'>
            <span onClick={onClose} className='px-4 text-main-black font-medium text-sm py-2 cursor-pointer hover:bg-dark-black/10 duration-300'>
                Settings
            </span>
            <span onClick={onClose} className='px-4 text-main-black font-medium text-sm py-2 cursor-pointer hover:bg-dark-black/10 duration-300'>
                LogOut
            </span>
        </div>
    )
}

export default UserProfile
