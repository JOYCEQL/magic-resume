import Tiptap from "@/components/Tiptap";
import useModelStore from "@/store/useModelStore";

const Project = () => {
  const { projectContent, setProjectContent } = useModelStore();
  return (
    <div>
      <Tiptap emitData={setProjectContent} content={projectContent}></Tiptap>
    </div>
  );
};

export default Project;
