"use client";
import Editor from "./compoents/Editor";
import Preview from "./compoents/Preview";
import styles from "./index.module.scss";
const WorkBench = () => {
  return (
    <div className={styles.container}>
      <Editor></Editor>
      <Preview></Preview>
    </div>
  );
};

export default WorkBench;
