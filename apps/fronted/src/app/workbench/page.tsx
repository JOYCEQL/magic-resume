"use client";
import Editor from "./compoents/Editor";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import Preview from "./compoents/Preview";
import styles from "./index.module.scss";
const WorkBench = () => {
  return (
    <div className={styles.container}>
      <ResizablePanelGroup
        direction="horizontal"
        className="h-[100vh] rounded-lg border "
      >
        <ResizablePanel>
          <Editor></Editor>
        </ResizablePanel>
        <ResizableHandle
          withHandle
          className="hover:w-[2px] hover:bg-[#80ed99]"
        />
        <ResizablePanel>
          <Preview></Preview>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default WorkBench;
