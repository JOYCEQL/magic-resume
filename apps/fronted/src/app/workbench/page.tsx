"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Type,
  Layout,
  Phone,
  Mail,
  Globe,
  MapPin,
  GraduationCap,
  Briefcase,
  Award,
  Plus,
  Trash,
  Download,
  User,
  Cpu,
  Calendar,
  Trash2
} from "lucide-react";
import RichTextEditor from "./compoents/Editor/RichText";

const TabIcon = ({ icon: Icon, label }) => (
  <div className="flex flex-col items-center gap-1">
    <Icon className="h-5 w-5" />
    <span className="text-xs">{label}</span>
  </div>
);

const FormField = ({ label, children }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium">{label}</Label>
    {children}
  </div>
);

const Section = ({ title, children, className = "" }) => (
  <div className={`space-y-4 ${className}`}>
    <h3 className="font-semibold text-lg flex items-center gap-2">{title}</h3>
    {children}
  </div>
);

// 简历数据结构
interface ResumeData {
  basics: {
    name: string;
    label: string;
    email: string;
    phone: string;
    website: string;
    location: string;
    summary: string;
  };
  education: Array<{
    institution: string;
    area: string;
    studyType: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  work: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  skills: Array<{
    name: string;
    level: string;
    keywords: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    highlights: string[];
    url: string;
  }>;
}

// 简历预览组件
const ResumePreview = ({ data }: { data: ResumeData }) => {
  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="relative h-full bg-gray-100 overflow-y-auto">
      {/* 固定的下载按钮 */}
      <div className="sticky top-4 z-10 container max-w-[21cm] mx-auto px-4">
        <div className="flex justify-end">
          <Button
            onClick={handleDownloadPDF}
            className="bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Download className="h-4 w-4 mr-2" />
            导出 PDF
          </Button>
        </div>
      </div>

      {/* 简历预览内容 */}
      <div
        id="resume-preview"
        className="max-w-[21cm] mx-auto my-8 bg-white shadow-2xl rounded-lg overflow-hidden"
      >
        {/* 个人信息头部 */}
        <header className="px-8 py-12 bg-gradient-to-br from-blue-50 to-indigo-50">
          <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">
            {data.basics.name}
          </h1>
          {data.basics.label && (
            <div className="text-xl text-gray-600 text-center mb-6">
              {data.basics.label}
            </div>
          )}
          <div className="flex justify-center flex-wrap gap-6 text-gray-600">
            {data.basics.email && (
              <div className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                <Mail className="h-4 w-4" />
                <span>{data.basics.email}</span>
              </div>
            )}
            {data.basics.phone && (
              <div className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                <Phone className="h-4 w-4" />
                <span>{data.basics.phone}</span>
              </div>
            )}
            {data.basics.location && (
              <div className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                <MapPin className="h-4 w-4" />
                <span>{data.basics.location}</span>
              </div>
            )}
            {data.basics.website && (
              <div className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                <Globe className="h-4 w-4" />
                <a
                  href={data.basics.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {data.basics.website}
                </a>
              </div>
            )}
          </div>
        </header>

        {/* 主要内容区域 */}
        <div className="p-8 space-y-8">
          {/* 个人简介 */}
          {data.basics.summary && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                个人简介
              </h2>
              <div className="text-gray-600 leading-relaxed">
                {data.basics.summary}
              </div>
            </section>
          )}

          {/* 工作经历 */}
          {data.work.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                工作经历
              </h2>
              <div className="space-y-6">
                {data.work.map((work, index) => (
                  <div
                    key={index}
                    className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-blue-600 before:rounded-full"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {work.company}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {work.startDate} - {work.endDate}
                      </span>
                    </div>
                    <div className="text-lg text-blue-600 mb-2">
                      {work.position}
                    </div>
                    <div
                      className="text-gray-600 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: work.description }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 教育经历 */}
          {data.education.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                教育经历
              </h2>
              <div className="space-y-6">
                {data.education.map((edu, index) => (
                  <div
                    key={index}
                    className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-blue-600 before:rounded-full"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {edu.institution}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {edu.startDate} - {edu.endDate}
                      </span>
                    </div>
                    <div className="text-lg text-blue-600 mb-2">
                      {edu.studyType} · {edu.area}
                    </div>
                    <div
                      className="text-gray-600 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: edu.description }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 技能专长 */}
          {data.skills.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                <Cpu className="h-5 w-5 text-blue-600" />
                技能专长
              </h2>
              <div className="grid grid-cols-2 gap-6">
                {data.skills.map((skill, index) => (
                  <div
                    key={index}
                    className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-blue-600 before:rounded-full"
                  >
                    <div className="font-semibold text-gray-900 mb-1">
                      {skill.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {skill.keywords.join(" · ")}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 项目经历 */}
          {data.projects.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                <Layout className="h-5 w-5 text-blue-600" />
                项目经历
              </h2>
              <div className="space-y-6">
                {data.projects.map((project, index) => (
                  <div
                    key={index}
                    className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-blue-600 before:rounded-full"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {project.name}
                      </h3>
                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          项目链接
                        </a>
                      )}
                    </div>
                    <div
                      className="text-gray-600 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: project.description }}
                    />
                    {project.highlights.length > 0 && (
                      <ul className="mt-2 space-y-1 text-gray-600">
                        {project.highlights.map((highlight, i) => (
                          <li
                            key={i}
                            className="relative pl-4 before:absolute before:left-0 before:top-[0.6em] before:w-1 before:h-1 before:bg-gray-400 before:rounded-full"
                          >
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

// 主编辑器组件
const ResumeEditor = () => {
  const [resumeData, setResumeData] = useState<ResumeData>({
    basics: {
      name: "",
      label: "",
      email: "",
      phone: "",
      website: "",
      location: "",
      summary: ""
    },
    education: [],
    work: [],
    skills: [],
    projects: []
  });

  // 更新基本信息
  const updateBasics = (field: keyof ResumeData["basics"], value: string) => {
    setResumeData((prev) => ({
      ...prev,
      basics: {
        ...prev.basics,
        [field]: value
      }
    }));
  };

  // 添加教育经历
  const addEducation = () => {
    setResumeData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          institution: "",
          area: "",
          studyType: "",
          startDate: "",
          endDate: "",
          description: ""
        }
      ]
    }));
  };

  return (
    <div className="h-screen flex">
      <div className="w-[800px] border-r h-full flex flex-col bg-gray-50/50">
        <Tabs defaultValue="basics" className="flex-1">
          <div className="border-b bg-white p-4">
            <TabsList className="grid grid-cols-5 h-auto gap-2 bg-muted/50 p-1">
              <TabsTrigger
                value="basics"
                className="data-[state=active]:bg-white flex flex-col gap-1 py-2"
              >
                <TabIcon icon={User} label="基本信息" />
              </TabsTrigger>
              <TabsTrigger
                value="education"
                className="data-[state=active]:bg-white flex flex-col gap-1 py-2"
              >
                <TabIcon icon={GraduationCap} label="教育经历" />
              </TabsTrigger>
              <TabsTrigger
                value="work"
                className="data-[state=active]:bg-white flex flex-col gap-1 py-2"
              >
                <TabIcon icon={Briefcase} label="工作经历" />
              </TabsTrigger>
              <TabsTrigger
                value="skills"
                className="data-[state=active]:bg-white flex flex-col gap-1 py-2"
              >
                <TabIcon icon={Layout} label="技能特长" />
              </TabsTrigger>
              <TabsTrigger
                value="projects"
                className="data-[state=active]:bg-white flex flex-col gap-1 py-2"
              >
                <TabIcon icon={Award} label="项目经历" />
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <TabsContent value="basics" className="mt-0 space-y-6">
              <Card className="border-none shadow-none bg-transparent">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="姓名">
                      <Input
                        value={resumeData.basics.name}
                        onChange={(e) => updateBasics("name", e.target.value)}
                        placeholder="你的名字"
                        className="bg-white"
                      />
                    </FormField>
                    <FormField label="职位">
                      <Input
                        value={resumeData.basics.label}
                        onChange={(e) => updateBasics("label", e.target.value)}
                        placeholder="期望职位"
                        className="bg-white"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="邮箱">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          value={resumeData.basics.email}
                          onChange={(e) =>
                            updateBasics("email", e.target.value)
                          }
                          placeholder="邮箱地址"
                          className="pl-10 bg-white"
                        />
                      </div>
                    </FormField>
                    <FormField label="电话">
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          value={resumeData.basics.phone}
                          onChange={(e) =>
                            updateBasics("phone", e.target.value)
                          }
                          placeholder="联系电话"
                          className="pl-10 bg-white"
                        />
                      </div>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="个人网站">
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          value={resumeData.basics.website}
                          onChange={(e) =>
                            updateBasics("website", e.target.value)
                          }
                          placeholder="个人网站或博客"
                          className="pl-10 bg-white"
                        />
                      </div>
                    </FormField>
                    <FormField label="地址">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          value={resumeData.basics.location}
                          onChange={(e) =>
                            updateBasics("location", e.target.value)
                          }
                          placeholder="所在城市"
                          className="pl-10 bg-white"
                        />
                      </div>
                    </FormField>
                  </div>

                  <FormField label="个人简介">
                    <RichTextEditor
                      content={resumeData.basics.summary}
                      onChange={(value) => updateBasics("summary", value)}
                      placeholder="简单介绍自己"
                    />
                  </FormField>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="education" className="mt-0 space-y-6">
              <Card className="border-none shadow-none bg-transparent">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-lg">教育经历</h3>
                  <Button
                    onClick={addEducation}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    添加教育经历
                  </Button>
                </div>

                <div className="space-y-6">
                  {resumeData.education.map((edu, index) => (
                    <Card key={index} className="p-6 bg-white">
                      <div className="space-y-4">
                        <FormField label="学校名称">
                          <Input
                            value={edu.institution}
                            onChange={(e) => {
                              const newEducation = [...resumeData.education];
                              newEducation[index].institution = e.target.value;
                              setResumeData({
                                ...resumeData,
                                education: newEducation
                              });
                            }}
                            placeholder="学校名称"
                          />
                        </FormField>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField label="开始时间">
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input
                                type="date"
                                value={edu.startDate}
                                onChange={(e) => {
                                  const newEducation = [
                                    ...resumeData.education
                                  ];
                                  newEducation[index].startDate =
                                    e.target.value;
                                  setResumeData({
                                    ...resumeData,
                                    education: newEducation
                                  });
                                }}
                                className="pl-10"
                              />
                            </div>
                          </FormField>
                          <FormField label="结束时间">
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input
                                type="date"
                                value={edu.endDate}
                                onChange={(e) => {
                                  const newEducation = [
                                    ...resumeData.education
                                  ];
                                  newEducation[index].endDate = e.target.value;
                                  setResumeData({
                                    ...resumeData,
                                    education: newEducation
                                  });
                                }}
                                className="pl-10"
                              />
                            </div>
                          </FormField>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField label="学历">
                            <Input
                              value={edu.studyType}
                              onChange={(e) => {
                                const newEducation = [...resumeData.education];
                                newEducation[index].studyType = e.target.value;
                                setResumeData({
                                  ...resumeData,
                                  education: newEducation
                                });
                              }}
                              placeholder="学历"
                            />
                          </FormField>
                          <FormField label="专业">
                            <Input
                              value={edu.area}
                              onChange={(e) => {
                                const newEducation = [...resumeData.education];
                                newEducation[index].area = e.target.value;
                                setResumeData({
                                  ...resumeData,
                                  education: newEducation
                                });
                              }}
                              placeholder="专业"
                            />
                          </FormField>
                        </div>

                        <FormField label="在校经历">
                          <RichTextEditor
                            content={edu.description}
                            onChange={(value) => {
                              const newEducation = [...resumeData.education];
                              newEducation[index].description = value;
                              setResumeData({
                                ...resumeData,
                                education: newEducation
                              });
                            }}
                            placeholder="在校经历描述"
                          />
                        </FormField>

                        <div className="flex justify-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const newEducation = resumeData.education.filter(
                                (_, i) => i !== index
                              );
                              setResumeData({
                                ...resumeData,
                                education: newEducation
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
      <div className="flex-1 h-full">
        <ResumePreview data={resumeData} />
      </div>
    </div>
  );
};

export default ResumeEditor;
