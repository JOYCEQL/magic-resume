export const exportResumeToBrowserPrint = (resumeContent: HTMLElement, pagePadding: number) => {
  const printFrame = document.createElement("iframe");
  printFrame.style.position = "absolute";
  printFrame.style.width = "1px";
  printFrame.style.height = "1px";
  printFrame.style.left = "-9999px";
  printFrame.style.top = "0";
  printFrame.style.visibility = "hidden";
  printFrame.style.zIndex = "-1";
  document.body.appendChild(printFrame);

  const iframeWindow = printFrame.contentWindow;
  if (!iframeWindow) {
    console.error("IFrame window not found");
    document.body.removeChild(printFrame);
    return;
  }

  try {
    iframeWindow.document.open();

    const clonedContent = resumeContent.cloneNode(true) as HTMLElement;
    const transformValue = clonedContent.style.transform || "";
    const match = transformValue.match(/scale\(([\d.]+)\)/);
    if (match) {
      const scale = Number(match[1]);
      if (Number.isFinite(scale) && scale > 0 && scale < 1) {
        // 打印时使用 zoom 参与分页布局计算，比 transform 更接近最终分页效果
        clonedContent.style.removeProperty("transform");
        clonedContent.style.removeProperty("transform-origin");
        clonedContent.style.setProperty("width", "100%");
        clonedContent.style.setProperty("zoom", String(scale));
      }
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Resume</title>
          <style>
            @font-face {
              font-family: "Alibaba PuHuiTi";
              src: url("/fonts/AlibabaPuHuiTi-3-55-Regular.ttf") format("truetype");
              font-weight: normal;
              font-style: normal;
              font-display: swap;
            }

            @page {
              size: A4;
              margin: 0;
              padding: 0;
            }
            * {
              box-sizing: border-box;
            }
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              background: white;
              height: auto !important;
              overflow: visible !important;
            }
            body {
              font-family: sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            #resume-preview {
              margin: 0 !important;
              padding: ${pagePadding}px !important;
              -webkit-box-decoration-break: clone;
              box-decoration-break: clone;
              font-family: "Alibaba PuHuiTi", sans-serif !important;
            }

            #print-content {
              width: 210mm;
              margin: 0 auto;
              padding: 0;
              background: white;
              box-shadow: none;
            }
            #print-content * {
              box-shadow: none !important;
            }

            #resume-preview .min-h-screen,
            #resume-preview .min-h-full {
              min-height: 0 !important;
            }
            
            .page-break-line {
              display: none;
            }

            ${Array.from(document.styleSheets)
              .map((sheet) => {
                try {
                  return Array.from(sheet.cssRules)
                    .map((rule) => rule.cssText)
                    .join("\\n");
                } catch (e) {
                  console.warn("Could not copy styles from sheet:", e);
                  return "";
                }
              })
              .join("\\n")}
          </style>
        </head>
        <body>
          <div id="print-content">
            ${clonedContent.outerHTML}
          </div>
        </body>
      </html>
    `;

    iframeWindow.document.write(htmlContent);
    iframeWindow.document.close();

    const printWhenReady = async () => {
      try {
        const doc = iframeWindow.document;
        if (doc.fonts?.ready) {
          await doc.fonts.ready;
        }

        const images = Array.from(doc.images);
        await Promise.all(
          images
            .filter((img) => !img.complete)
            .map(
              (img) =>
                new Promise<void>((resolve) => {
                  img.onload = () => resolve();
                  img.onerror = () => resolve();
                })
            )
        );

        await new Promise<void>((resolve) => {
          iframeWindow.requestAnimationFrame(() => {
            iframeWindow.requestAnimationFrame(() => resolve());
          });
        });

        iframeWindow.focus();
        iframeWindow.print();

        // 打印完成后清理iframe
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 1000);
      } catch (error) {
        console.error("Error print:", error);
        document.body.removeChild(printFrame);
      }
    };

    void printWhenReady();
  } catch (error) {
    console.error("Error setting up print:", error);
    document.body.removeChild(printFrame);
  }
};
