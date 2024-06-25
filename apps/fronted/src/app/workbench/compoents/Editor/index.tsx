import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import BasicInfo from "../BasicInfo";
import Skills from "../Skills";
import Project from "../Project";
import Empolyment from "../Empolyment";
import Education from "../Education";
import Cert from "../Cert";
import { UserRound, PencilRuler, FileJson, Network } from "lucide-react";
const Editor = () => {
  const [activeTab, setActiveTab] = useState("basic");
  const tabList = [
    {
      value: "basic",
      label: "基本信息",
      icon: <UserRound size={16} />
    },
    {
      value: "skills",
      label: "专业技能",
      icon: <PencilRuler size={16} />
    },
    {
      value: "project",
      label: "项目经历",
      icon: <FileJson size={16} />
    },
    {
      value: "empolyment",
      label: "工作经历",
      icon: <Network size={16} />
    },
    {
      value: "education",
      label: "教育经历",
      icon: <UserRound size={16} />
    },
    {
      value: "cert",
      label: "技能证书",
      icon: <UserRound size={16} />
    }
  ];
  return (
    <div className="flex flex-1 p-[12px]">
      <div className="w-[72px] shrink-0 mr-[10px]	bg-[#ecedee]">
        {tabList.map((item, index) => {
          return (
            <div
              key={index}
              className="flex flex-col items-center text-[12px] p-[12px] cursor-pointer hover:bg-[#e3e3e5] hover:rounded-[4px]"
            >
              <div>{item.icon}</div>
              <div>{item.label}</div>
            </div>
          );
        })}
      </div>
      <div className="bg-[#fff] p-[12px] rounded-[6px]">
        <div className="text-[24px] mb-[10px]">前端-xx-x年</div>

        <div className="mt-[12px]">
          <div className="text-[20px] mb-[12px]">基本信息</div>
          <BasicInfo></BasicInfo>
          <div className="text-[20px] mb-[12px]">专业技能</div>
          <Skills></Skills>
          <div className="text-[20px] mb-[12px]">项目经历</div>
          <Project></Project>
          <div className="text-[20px] mb-[12px]">工作经历</div>
          <Empolyment></Empolyment>
          <div className="text-[20px] mb-[12px]">教育经历</div>
          <Education></Education>
          <div className="text-[20px]">技能证书</div>
          <Cert></Cert>
        </div>
      </div>
    </div>
  );
};

export default Editor;
