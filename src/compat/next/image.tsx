import type { CSSProperties, ImgHTMLAttributes } from "react";

export type StaticImageData = {
  src: string;
  width: number;
  height: number;
  blurDataURL?: string;
};

type ImageSource = string | StaticImageData;

type NextImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: ImageSource;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: "empty" | "blur";
  blurDataURL?: string;
  unoptimized?: boolean;
  loader?: (params: { src: string; width: number; quality?: number }) => string;
};

function resolveSrc(src: ImageSource): string {
  return typeof src === "string" ? src : src.src;
}

export default function Image({
  src,
  alt,
  width,
  height,
  fill,
  priority,
  quality,
  placeholder,
  blurDataURL,
  unoptimized,
  loader,
  style,
  ...rest
}: NextImageProps) {
  const resolvedSrc = resolveSrc(src);

  const fillStyle: CSSProperties = fill
    ? {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        ...style
      }
    : {
        ...style
      };

  const priorityAttributes = priority
    ? ({ fetchpriority: "high" } as Record<string, string>)
    : {};

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? "eager" : rest.loading}
      style={fillStyle}
      {...rest}
      {...priorityAttributes}
    />
  );
}
