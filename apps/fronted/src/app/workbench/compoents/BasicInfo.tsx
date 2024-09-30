import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import useBaseInfoStore from "@/store/useBaseInfoStore";

const BasicInfo = () => {
  const [date, setDate] = useState<Date>();
  const [isDateOpen, setIsDateOpen] = useState<boolean>(false);
  const {
    name,
    setName,
    phone,
    setPhone,
    wechat,
    setWechat,
    email,
    setEmail,
    birthday,
    setBirthday,
    jobName,
    setJobName
  } = useBaseInfoStore();
  return (
    <div className="flex items-center flex-wrap gap-[16px]">
      <div className="flex items-center flex-[48%] ">
        <Label htmlFor="name" className="w-[80px]">
          姓名
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-[200px] flex-1"
        />
      </div>
      <div className="flex items-center flex-[48%]">
        <Label htmlFor="phone" className="w-[80px]">
          手机号码
        </Label>
        <Input
          id="phone"
          maxLength={20}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-[200px] flex-1"
        />
      </div>
      <div className="flex items-center flex-[48%]">
        <Label htmlFor="wechat" className="w-[80px]">
          微信
        </Label>
        <Input
          id="wechat"
          value={wechat}
          onChange={(e) => setWechat(e.target.value)}
          className="w-[200px] flex-1"
        />
      </div>
      <div className="flex items-center flex-[48%]">
        <Label htmlFor="email" className="w-[80px]">
          电子邮件
        </Label>
        <Input
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-[200px] flex-1"
        />
      </div>
      <div className="flex items-center flex-[48%]">
        <Label htmlFor="jobName" className="w-[80px]">
          职位名称
        </Label>
        <Input
          id="jobName"
          value={jobName}
          onChange={(e) => setJobName(e.target.value)}
          className="w-[200px] flex-1"
        />
      </div>
      <div className="flex items-center flex-[48%]">
        <Label htmlFor="birthday" className="w-[80px]">
          出生日期
        </Label>
        <Popover open={isDateOpen}>
          <PopoverTrigger asChild>
            <div className="relative flex-1 w-[200px]">
              <CalendarIcon className="left-[10px] top-[12px] absolute   h-4 w-4" />
              <Input
                id="birthday"
                className="flex-1  pl-[36px] "
                value={
                  birthday ? format(birthday, "yyyy-MM-dd") : "Pick a date"
                }
                onClick={() => setIsDateOpen(true)}
              ></Input>
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0"
            onFocusOutside={() => setIsDateOpen(false)}
            onPointerDownOutside={() => setIsDateOpen(false)}
          >
            <Calendar
              mode="single"
              selected={birthday}
              onSelect={(val) => {
                setIsDateOpen(false);
                setBirthday(val);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default BasicInfo;
