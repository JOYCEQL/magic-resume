import { create } from "zustand";

interface BaseInfoState {
  resumeTitle: string;
  name: string;
  setName: (name: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  wechat: string;
  setWechat: (wechat: string) => void;
  email: string;
  setEmail: (email: string) => void;
  birthday: Date;
  setBirthday: (birthday: Date) => void;
  jobName: string;
  setJobName: (jobName: string) => void;
}

const useBaseInfoStore = create<BaseInfoState>((set) => ({
  resumeTitle: "前端",
  name: "牛马人",
  setName: (name: string) => set({ name }),
  phone: "1234567",
  setPhone: (phone: string) => set({ phone }),
  wechat: "niuma",
  setWechat: (wechat: string) => set({ wechat }),
  email: "mofang@gmail.com",
  setEmail: (email: string) => set({ email }),
  birthday: new Date(2024, 5, 20),
  setBirthday: (birthday: Date) => set({ birthday }),
  jobName: "前端工程师/5年经验",
  setJobName: (jobName: string) => set({ jobName })
}));

export default useBaseInfoStore;
