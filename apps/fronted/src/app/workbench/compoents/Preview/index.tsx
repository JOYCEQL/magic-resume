import useBaseInfoStore from "@/store/useBaseInfoStore";
import dayjs from "dayjs";
const Preview = () => {
  const { name, phone, wechat, email, birthday, jobName } = useBaseInfoStore();
  return (
    <div className="flex-1  p-[12px] h-[100vh] ">
      <div className="p-[12px]   h-[100%] rounded-[6px] bg-[#fff] flex ">
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
      </div>
    </div>
  );
};

export default Preview;
