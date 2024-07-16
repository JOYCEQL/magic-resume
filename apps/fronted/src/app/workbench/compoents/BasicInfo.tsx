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
  const { name } = useBaseInfoStore();
  return (
    <div className="flex items-center flex-wrap gap-[16px]">
      <div className="flex items-center flex-[48%] ">
        <Label htmlFor="name" className="w-[80px]">
          姓名
        </Label>
        <Input id="name" value={name} className="w-[200px] flex-1" />
      </div>
      <div className="flex items-center flex-[48%]">
        <Label htmlFor="phone" className="w-[80px]">
          手机号码
        </Label>
        <Input id="phone" className="w-[200px] flex-1" />
      </div>
      <div className="flex items-center flex-[48%]">
        <Label htmlFor="wechat" className="w-[80px]">
          微信
        </Label>
        <Input id="wechat" className="w-[200px] flex-1" />
      </div>
      <div className="flex items-center flex-[48%]">
        <Label htmlFor="email" className="w-[80px]">
          电子邮件
        </Label>
        <Input id="email" className="w-[200px] flex-1" />
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
                value={date ? format(date, "PPP") : "Pick a date"}
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
              selected={date}
              onSelect={(val) => {
                setIsDateOpen(false);
                setDate(val);
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
