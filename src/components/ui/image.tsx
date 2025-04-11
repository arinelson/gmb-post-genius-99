
import React from "react";
import { cn } from "@/lib/utils";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: string;
}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ className, aspectRatio, alt, ...props }, ref) => {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-md",
          aspectRatio && `relative w-full [padding-bottom:${aspectRatio}]`,
          className
        )}
      >
        <img
          ref={ref}
          className={cn(
            "h-auto w-full object-cover",
            aspectRatio && "absolute inset-0 h-full w-full"
          )}
          alt={alt || "Image"}
          {...props}
        />
      </div>
    );
  }
);

Image.displayName = "Image";

export { Image };
