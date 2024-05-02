export const convertSecondsToMinSec = (seconds) => {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
};

export const getDirectionAngleBySpeed = (xSpeed: number, ySpeed: number) => {
  return Math.atan2(ySpeed, xSpeed) * (180 / Math.PI);
};

export const getDuration = ({ x1, y1, x2, y2, moveSpeed }) => {
  const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  return distance / moveSpeed;
};
