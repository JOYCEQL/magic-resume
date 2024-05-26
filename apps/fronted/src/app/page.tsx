import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>魔方简历</div>
      <Button>开始使用</Button>
    </main>
  );
}
