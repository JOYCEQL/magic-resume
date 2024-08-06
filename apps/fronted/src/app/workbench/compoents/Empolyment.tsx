import Tiptap from "@/components/Tiptap";
import useModelStore from "@/store/useModelStore";
const Empolyment = () => {
  const { workContent, setWorkContent } = useModelStore();
  return (
    <div>
      <Tiptap emitData={setWorkContent} content={workContent}></Tiptap>
    </div>
  );
};

export default Empolyment;
