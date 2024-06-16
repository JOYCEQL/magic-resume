import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Editor = () => {
  return (
    <div className="flex-1 bg-[#fff] p-[12px]">
      {/* 简历编辑表单 */}
      <div className="text-[24px] mb-[10px]">前端-xx-x年</div>
      <Tabs defaultValue="basic" className="w-[400px]">
        <TabsList>
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="skills">专业技能</TabsTrigger>
          <TabsTrigger value="project">项目经历</TabsTrigger>
          <TabsTrigger value="empolyment">工作经历</TabsTrigger>
          <TabsTrigger value="education">教育经历</TabsTrigger>
          <TabsTrigger value="cert">技能证书</TabsTrigger>
        </TabsList>
        <TabsContent value="basic">
          Make changes to your account here.
        </TabsContent>
        <TabsContent value="skills">Change your password here.</TabsContent>
      </Tabs>
    </div>
  );
};

export default Editor;
