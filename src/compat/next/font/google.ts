type FontResult = {
  className: string;
  style: { fontFamily: string };
};

function createFont(family: string): FontResult {
  return {
    className: "",
    style: {
      fontFamily: family
    }
  };
}

export function Inter() {
  return createFont("Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif");
}
