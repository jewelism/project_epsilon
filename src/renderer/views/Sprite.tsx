/* eslint-disable react/require-default-props */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import PixelAnimals from '@/public/pixel_animals.png';

type SpriteProps = {
  frameNo: number;
  onClick?: ({ event, frameNo }) => void;
};
const frameSize = 16;
const row = 8;
export function Sprite({ frameNo, onClick = () => null }: SpriteProps) {
  const xPosition = (frameNo % row) * frameSize;
  const yPosition = Math.floor(frameNo / row) * frameSize;

  return (
    <div
      style={{
        width: frameSize,
        height: frameSize,
        backgroundImage: `url(${PixelAnimals})`,
        backgroundPosition: `${-xPosition}px ${-yPosition}px`,
        zoom: 3,
      }}
      onClick={(e) => onClick({ event: e, frameNo })}
    />
  );
}
