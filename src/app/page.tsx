import Footer from "@/components/common/Footer";
import LayoutHero from "@/components/common/LayoutHero";
import Faq from "@/components/home/Faq";
import FirstProject from "@/components/home/FirstProject";
import OurPlan from "@/components/home/OurPlan";
import StartBuild from "@/components/home/StartBuild";
import TemplatesCanva from "@/components/home/TemplatesCanva";
import Trusted from "@/components/home/Trusted";
import YourPath from "@/components/home/YourPath";

export default function Home() {
  return (
    <div className="">
      <LayoutHero />
      <FirstProject />
      <YourPath />
      <TemplatesCanva />
      <OurPlan />
      <Faq />
      <StartBuild />
      <Trusted />
      <Footer />
    </div>
  );
}
