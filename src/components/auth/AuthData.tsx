import Image from 'next/image'
import Link from 'next/link'
import Paragraph from '../common/Paragraph'

const AuthData = () => {
    return (
        <div className='max-w-120 w-full px-4 mx-auto flex justify-center items-center sm:px-0 min-h-screen py-10'>
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
                <div className="p-4 sm:p-6 lg:p-8 bg-white border border-[#E2E8F0] rounded-xl md:rounded-2xl lg:rounded-3xl">
                    <Paragraph center bold mainblack>
                        Continue to Inventa
                    </Paragraph>
                    <Paragraph center base gray className='pt-1 pb-5'>
                        Start your Inventa learning journey
                    </Paragraph>
                    <Link href={"/auth/role"}>
                        <button className='w-full text-sm py-3 bg-blue text-white duration-300 hover:bg-black cursor-pointer rounded-lg font-medium'>
                            Sign up
                        </button>
                    </Link>
                    <Link href={"/auth/sign-in"}>
                        <button className='w-full mt-3 text-sm py-3 bg-white border border-[#E2E8F0] duration-300 hover:bg-black hover:text-white hover:border-white text-main-black cursor-pointer rounded-lg font-medium'>
                            Sign in
                        </button>
                    </Link>
                    <Paragraph sm medium mainblack center className='py-7'>
                        Made for Indian School boards (CBSE, State Boards)
                    </Paragraph>
                    <Paragraph sm medium mainblack center>
                        <Link href={"/"} className='hover:text-blue'>Terms</Link> <span className='px-4 font-bold text-lg'>•</span> <Link href={"/"} className='hover:text-blue'>Privacy</Link>
                    </Paragraph>
                </div>
            </div>
        </div >
    )
}

export default AuthData
