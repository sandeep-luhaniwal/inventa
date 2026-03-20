import DashBoardHero from "@/components/dashboard/home/DashBoardHero";
import QuickStartProject from "@/components/dashboard/home/QuickStartProject";
import TemplatesForYou from "@/components/dashboard/home/TemplatesForYou";


export default function page() {
  return (
    <div className='bg-[#F9FAFB] p-4 lg:p-6 xl:p-8'>
      <DashBoardHero />
      <QuickStartProject />
      <TemplatesForYou />
    </div>
  )
}
