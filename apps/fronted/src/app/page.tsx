import Image from "next/image";
import { redirect } from "next/navigation";

import { CircleArrowRight } from "lucide-react";
import EditButton from "@/components/EditButton";
import IconLogo from "@/assets/images/logo@2x.svg";
export default function Home() {
  const goWorkbench = () => {
    redirect("/workbench/index");
  };

  return (
    <main className="flex min-h-screen flex-col items-center  p-[24px]">
      <header className="flex justify-between w-[100%]">
        <div>
          <Image src={IconLogo} alt="logo"></Image>
        </div>
        <EditButton>前往工作台</EditButton>
      </header>
      <section className="flex flex-col items-center">
        <h1 className="text-[48px]">极度自由的在线简历编辑器</h1>
        <EditButton className="w-[160px] text-[18px] mt-[36px]">
          开始使用 <CircleArrowRight className="ml-[10px]" />
        </EditButton>
      </section>
      <div className="w-[900px] h-[500px] bg-[red] mt-[60px] rounded-[32px]"></div>
    </main>
  );
}
