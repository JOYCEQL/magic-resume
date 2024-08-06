import dayjs from "dayjs";
import { Separator } from "@/components/ui/separator";
import useBaseInfoStore from "@/store/useBaseInfoStore";
import useModelStore from "@/store/useModelStore";

const Preview = () => {
  const { name, phone, wechat, email, birthday, jobName } = useBaseInfoStore();
  const { skillContent, projectContent } = useModelStore();
  return (
    <div className="flex-1  p-[12px] h-[100vh] ">
      <div className="p-[12px]   h-[100%] rounded-[6px] bg-[#fff] flex flex-col ">
        <div className="flex justify-between h-fit w-[100%] ">
          <div className="w-[40%]">
            <div className="text-[30px] font-[500]">{name}</div>
            <div>{jobName}</div>
          </div>
          <div className="flex-1 flex  gap-[6px]  flex-wrap	">
            <div className="flex-[240px] flex">
              <div>手机号码: </div>
              {phone}
            </div>
            <div className="flex-[240px] flex">
              <div>微信: </div>
              {wechat}
            </div>
            <div className="flex-[240px] flex">
              <div>邮箱: </div>
              {email}
            </div>
            <div className="flex-[240px] flex">
              <div>出生日期: </div>
              {dayjs(birthday).format("YYYY-MM-DD")}
            </div>
          </div>
        </div>
        <div className="mt-[12px] ">
          <div className="text-[20px]">专业技能</div>
          <Separator className="my-[12px]"></Separator>
          <div dangerouslySetInnerHTML={{ __html: skillContent }} />
        </div>
        <div className="mt-[12px] ">
          <div className="text-[20px]">项目经历</div>
          <Separator className="my-[12px]"></Separator>
          <div dangerouslySetInnerHTML={{ __html: projectContent }} />
        </div>
      </div>
    </div>
  );
};

export default Preview;
