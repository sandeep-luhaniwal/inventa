import Link from 'next/link'

export default function DashboardNotFound() {
    return (
        <div className='min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB] px-4'>
            <h1 className='text-8xl font-bold text-blue'>404</h1>
            <h2 className='text-2xl font-bold text-main-black mt-4'>Page Not Found</h2>
            <p className='text-gray text-sm mt-2 text-center'>This dashboard page doesn't exist or has been moved.</p>
            <Link href='/dashboard' className='mt-6 px-6 py-3 bg-blue text-white text-sm font-medium rounded-lg hover:bg-black duration-300'>
                Go to Dashboard
            </Link>
        </div>
    )
}
