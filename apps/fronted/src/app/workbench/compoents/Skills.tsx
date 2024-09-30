import Tiptap from "@/components/Tiptap";
import useModelStore from "@/store/useModelStore";
const Skills = () => {
  const { skillContent, setSkillContent } = useModelStore();
  return (
    <div>
      <Tiptap emitData={setSkillContent} content={skillContent}></Tiptap>
    </div>
  );
};

export default Skills;
