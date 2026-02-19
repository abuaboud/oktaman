import React, { useState, useEffect } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { colorsUtils } from '@/lib/color-utils';
import { cn } from '@/lib/utils';

interface ImageWithColorBackgroundProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  border?: boolean;
  backgroundColor?: string;
  imgClassName?: string;
}
const ImageWithColorBackground = ({
  src,
  alt,
  fallback,
  backgroundColor: customBackgroundColor,
  imgClassName,
  ...props
}: ImageWithColorBackgroundProps) => {
  // Data URLs (like SVG data URLs) load instantly, so skip loading state for them
  const isDataUrl = src?.startsWith('data:');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(!isDataUrl);

  const extractedBackgroundColor = colorsUtils.useAverageColorInImage({
    imgUrl: src ?? '',
    transparency: 5,
  });

  const backgroundColor = customBackgroundColor || extractedBackgroundColor;

  // Reset loading state when src changes
  useEffect(() => {
    if (isDataUrl) {
      setIsLoading(false);
      setHasError(false);
    } else {
      setIsLoading(true);
      setHasError(false);
    }
  }, [src, isDataUrl]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const { className, ...rest } = props;
  return (
    <span
      className={cn(
        'relative inline-block rounded-lg',
        className,
        {
          'bg-background': backgroundColor === null,
          'border border-border/50 dark:bg-foreground/10':
            backgroundColor === null && props.border,
        },
      )}
      style={
        backgroundColor
          ? {
              backgroundColor: backgroundColor,
            }
          : {}
      }
    >
      {isLoading && !hasError && (
        <span className="absolute inset-0 flex items-center justify-center">
          {fallback ?? <Skeleton className="w-full h-full" />}
        </span>
      )}
      {!hasError ? (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            `transition-opacity duration-500 w-full h-full object-contain`,
            {
              'opacity-0': isLoading,
              'opacity-100': !isLoading,
            },
            imgClassName
          )}
          {...rest}
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center">
          {fallback ?? <Skeleton className="w-full h-full" />}
        </span>
      )}
    </span>
  );
};

export { ImageWithColorBackground };
