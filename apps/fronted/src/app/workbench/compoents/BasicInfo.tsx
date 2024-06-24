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

const BasicInfo = () => {
  const [date, setDate] = useState<Date>();
  return (
    <div className="flex items-center flex-wrap gap-[16px]">
      <div className="flex items-center flex-[48%] ">
        <Label htmlFor="name" className="w-[80px]">
          姓名
        </Label>
        <Input id="name" className="w-[200px]" />
      </div>
      <div className="flex items-center flex-[48%]">
        <Label htmlFor="phone" className="w-[80px]">
          手机号码
        </Label>
        <Input id="phone" className="w-[200px]" />
      </div>
      <div className="flex items-center flex-[48%]">
        <Label htmlFor="wechat" className="w-[80px]">
          微信
        </Label>
        <Input id="wechat" className="w-[200px]" />
      </div>
      <div className="flex items-center flex-[48%]">
        <Label htmlFor="wechat" className="w-[80px]">
          出生日期
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={"outline"}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default BasicInfo;
