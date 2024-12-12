"use client";
import { openAIRequest } from "@/utils";

const CreateResume = () => {
  const createResumeByAI = () => {
    openAIRequest("你是谁");
  };
  return (
    <button
      onClick={createResumeByAI}
      className="px-6 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-r-lg hover:opacity-90 transition-opacity font-medium"
    >
      生成简历
    </button>
  );
};

export default CreateResume;
