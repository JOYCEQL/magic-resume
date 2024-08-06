import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRef, useState } from "react";
import BasicInfo from "../BasicInfo";
import Skills from "../Skills";
import Project from "../Project";
import Empolyment from "../Empolyment";
import Education from "../Education";
import Cert from "../Cert";
import {
  UserRound,
  PencilRuler,
  FileJson,
  Network,
  GraduationCap,
  BookOpen,
  Pencil,
  PenLine
} from "lucide-react";

import useBaseInfoStore from "@/store/useBaseInfoStore";
const Editor = () => {
  const [activeTab, setActiveTab] = useState("basic");
  const basicRef = useRef(null);
  const skillsRef = useRef(null);
  const projectRef = useRef(null);
  const educationRef = useRef(null);
  const certRef = useRef(null);
  const empolymentRef = useRef(null);
  const { resumeTitle } = useBaseInfoStore();

  const tabList = [
    {
      value: "basic",
      label: "基本信息",
      icon: <UserRound size={16} />,
      ref: basicRef
    },
    {
      value: "skills",
      label: "专业技能",
      icon: <PencilRuler size={16} />,
      ref: skillsRef
    },
    {
      value: "project",
      label: "项目经历",
      icon: <FileJson size={16} />,
      ref: projectRef
    },
    {
      value: "empolyment",
      label: "工作经历",
      icon: <Network size={16} />,
      ref: empolymentRef
    },
    {
      value: "education",
      label: "教育经历",
      icon: <GraduationCap size={16} />,
      ref: educationRef
    },
    {
      value: "cert",
      label: "技能证书",
      icon: <BookOpen size={16} />,
      ref: certRef
    }
  ];
  return (
    <div className="flex flex-1 p-[12px] h-[100vh]">
      <div className="w-[72px] shrink-0 mr-[10px]	bg-[#ecedee]">
        {tabList.map((item, index) => {
          return (
            <div
              key={index}
              className="flex flex-col items-center text-[12px] p-[12px] cursor-pointer hover:bg-[#e3e3e5] hover:rounded-[4px]"
              onClick={() => {
                item.ref.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "end",
                  inline: "nearest"
                });
              }}
            >
              <div>{item.icon}</div>
              <div>{item.label}</div>
            </div>
          );
        })}
      </div>
      <div
        className="bg-[#fff] p-[12px] rounded-[6px] overflow-auto "
        style={{ scrollbarWidth: "none" }}
      >
        <div className="text-[24px] mb-[10px]">{resumeTitle}</div>

        <div className="mt-[12px]">
          <div className="flex text-[20px] mb-[12px]" ref={basicRef}>
            基本信息
            <PenLine className="cursor-pointer ml-[4px] w-[16px] text-[#909399]"></PenLine>
          </div>
          <BasicInfo></BasicInfo>
          <div
            className="flex items-center text-[20px] mb-[12px]"
            ref={skillsRef}
            contentEditable={false}
          >
            专业技能
            <PenLine className="cursor-pointer ml-[4px] w-[16px] text-[#909399]"></PenLine>
          </div>
          <Skills></Skills>
          <div
            className="flex items-center text-[20px] mb-[12px]"
            ref={projectRef}
          >
            项目经历
            <PenLine className="cursor-pointer ml-[4px] w-[16px] text-[#909399]"></PenLine>
          </div>
          <Project></Project>
          <div
            ref={empolymentRef}
            className="flex items-center text-[20px] mb-[12px]"
          >
            工作经历
            <PenLine className="cursor-pointer ml-[4px] w-[16px] text-[#909399]"></PenLine>
          </div>
          <Empolyment></Empolyment>
          <div
            ref={educationRef}
            className="flex items-center text-[20px] mb-[12px]"
          >
            教育经历
            <PenLine className="cursor-pointer ml-[4px] w-[16px] text-[#909399]"></PenLine>
          </div>
          <Education></Education>
          <div ref={certRef} className="flex items-center text-[20px]">
            技能证书
            <PenLine className="cursor-pointer ml-[4px] w-[16px] text-[#909399]"></PenLine>
          </div>
          <Cert></Cert>
        </div>
      </div>
    </div>
  );
};

export default Editor;
