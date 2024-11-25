/**
 * @description Converts all images in the HTML element to base64 encoded data
 * @param element - The HTML element to convert. This is cloned and modified
 * @returns Converted HTML string.
 */
export async function convertImagesToBase64(
  element: HTMLElement
): Promise<string> {
  const clone = element.cloneNode(true) as HTMLElement;
  const images = clone.getElementsByTagName("img");

  await Promise.all(
    Array.from(images).map(async (img) => {
      try {
        const response = await fetch(img.src);
        const blob = await response.blob();
        return new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            img.src = reader.result as string;
            resolve();
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error("Error converting image:", error);
      }
    })
  );

  return clone.innerHTML;
}
