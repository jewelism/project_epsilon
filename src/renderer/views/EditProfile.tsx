/* eslint-disable react/no-array-index-key */

import { Sprite } from '@/views/Sprite';

type EditProfileProps = {
  nickInput: string;
  setNickInput: (value: string) => void;
  frameNo: number;
  setFrameNo: (value: number) => void;
  onClickSaveProfile: () => void;
};
function EditProfile({
  nickInput,
  setNickInput,
  frameNo,
  setFrameNo,
  onClickSaveProfile,
}: EditProfileProps) {
  const onClickChar = ({ frameNo: fno }) => {
    setFrameNo(fno);
  };
  return (
    <div className="flex-center">
      <div className="char_boxes_wrap">
        {Array.from({ length: 24 }, () => null).map((_, index) => {
          return (
            <Sprite key={index} frameNo={index * 2} onClick={onClickChar} />
          );
        })}
      </div>
      <div className="flex-center">
        <input
          type="text"
          placeholder="enter nickname"
          maxLength={10}
          value={nickInput}
          onChange={({ target }) => {
            setNickInput(target.value);
          }}
        />
        <Sprite frameNo={frameNo} />
        <br />
        <div>
          <button type="button" onClick={onClickSaveProfile}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;
