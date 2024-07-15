const colorList = [
  // 富文本文字顏色值，字符串格式
  "#000000",
  "#ffffff",
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#00ffff",
  "#ff00ff",
  "#c0c0c0",
  "#808080",
  "#800000",
  "#008000",
  "#000080",
  "#808000",
  "#008080"
];

interface IProps {
  setCurrentColor: (color: string) => () => void;
}

const ColorBar = ({ setCurrentColor }: IProps) => {
  return (
    <div>
      <div className="flex flex-wrap">
        {colorList.map((color, index) => {
          return (
            <div
              key={index}
              className="shrink-0 cursor-pointer hover:scale-[1.3] transition-all"
              onClick={setCurrentColor(color)}
              style={{
                width: "20px",
                height: "20px",
                backgroundColor: color,
                margin: "5px",
                borderRadius: "50%"
              }}
            ></div>
          );
        })}
      </div>
    </div>
  );
};

export default ColorBar;
