import { useQuery } from '@tanstack/react-query';
import { FastAverageColor } from 'fast-average-color';

export const colorsUtils = {
  fac: new FastAverageColor(),
  useAverageColorInImage: ({
    imgUrl,
    transparency,
  }: {
    imgUrl: string;
    transparency: number;
  }) => {
    const { data } = useQuery({
      queryKey: ['averageColorInImage', imgUrl, transparency],
      queryFn: async () => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imgUrl;
        return new Promise<string | null>((resolve) => {
          img.onload = () => {
            colorsUtils.fac
              .getColorAsync(img, { algorithm: 'simple' })
              .then((color) => {
                const [r, g, b] = color.value;
                resolve(
                  `color-mix(in srgb, rgb(${r},${g},${b}) ${transparency}%, #fff 92%)`,
                );
              })
              .catch((error) => {
                console.error("Error getting average color in image", error);
                resolve(null);
              });
          };
        });
      },
    });
    return data;
  },
};
