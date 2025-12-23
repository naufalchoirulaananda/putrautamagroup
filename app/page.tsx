import AfterHeroSection from "@/components/mainpage/AfterHeroSection";
import CompanyGroup from "@/components/mainpage/CompanyGroup";
import CompanyProfileSection from "@/components/mainpage/CompanyProfileSection";
import HeroSection from "@/components/mainpage/HeroSection";
import NewsBlog from "@/components/mainpage/NewsBlog";
import { RunningIcons } from "@/components/mainpage/RuningIcons";
import StatisticSection from "@/components/mainpage/StatisticSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <AfterHeroSection />
      <CompanyProfileSection />
      <StatisticSection />
      <CompanyGroup />
      <NewsBlog/>
      <RunningIcons />
    </>
  );
}
