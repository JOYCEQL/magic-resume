import Tiptap from "@/components/Tiptap";
import useModelStore from "@/store/useModelStore";

const Project = () => {
  const { projectContent, setProjectContent, projectList } = useModelStore();
  return (
    <div>
      <div>
        <div>
          {projectList.map((item) => (
            <>
              {item.isEdit && (
                <div key={item.name}>
                  <div
                    className="cursor-pointer"
                    onClick={() => setProjectContent(item.content)}
                  >
                    {item.name}
                  </div>
                  <Tiptap
                    emitData={setProjectContent}
                    content={projectContent}
                  ></Tiptap>
                </div>
              )}
              {!item.isEdit && (
                <div key={item.name}>
                  <div
                    className="cursor-pointer border px-4 py-4 mb-[12px] rounded-[6px]"
                    onClick={() => setProjectContent(item.content)}
                  >
                    {item.name}
                  </div>
                </div>
              )}
            </>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Project;
