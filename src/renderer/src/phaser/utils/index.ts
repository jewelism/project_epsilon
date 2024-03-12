const isWithinGap = (tile, object, tileGap) => {
  return Math.abs(tile.pixelX - object.x) < tileGap && Math.abs(tile.pixelY - object.y) < tileGap;
};

export const convertSecondsToMinSec = (seconds) => {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
};
