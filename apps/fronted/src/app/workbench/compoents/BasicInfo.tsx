import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BasicInfo = () => {
  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="terms">姓名</Label>
      <Input id="terms" className="w-[200px]" />
    </div>
  );
};

export default BasicInfo;
