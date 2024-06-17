import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import BasicInfo from "../BasicInfo";
import Skills from "../Skills";
import Project from "../Project";
import Empolyment from "../Empolyment";
import Education from "../Education";
import Cert from "../Cert";

const Editor = () => {
  const [activeTab, setActiveTab] = useState("basic");
  return (
    <div className="flex-1 bg-[#fff] p-[12px]">
      {/* 简历编辑表单 */}
      <div className="text-[24px] mb-[10px]">前端-xx-x年</div>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-[400px]"
      >
        <TabsList>
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="skills">专业技能</TabsTrigger>
          <TabsTrigger value="project">项目经历</TabsTrigger>
          <TabsTrigger value="empolyment">工作经历</TabsTrigger>
          <TabsTrigger value="education">教育经历</TabsTrigger>
          <TabsTrigger value="cert">技能证书</TabsTrigger>
        </TabsList>
      </Tabs>
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
  );
};

export default Editor;
