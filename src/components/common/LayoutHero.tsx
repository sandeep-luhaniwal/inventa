import React from 'react'
import NavBar from './NavBar'
import Hero from '../home/Hero'

const LayoutHero = () => {
    return (
        <div className="bg-light-blue relative overflow-clip">
            <div className="relative z-10 pt-6 lg:pt-10 max-w-330.5 px-4 mx-auto w-full">
            <span className='block w-125 z-10 h-125 rounded-full bg-vivid absolute -top-62.5 -left-24 blur-[140px]'></span>
            <span className="w-295 block h-111 absolute -bottom-10 -left-100 bg-[linear-gradient(to_top,#96C2EC_0%,#8EC1EE_31%,#74B6E9_41%,#35A3E5_48%,#1E8ADA_54%,#3983D4_72%)] min-[1600px]:blur-2xl"></span>
                <NavBar />
                <Hero />
            </div>
        </div>
    )
}

export default LayoutHero
