import { useEffect, useLayoutEffect, useState } from 'react';

export function Option({ onClickExit }: { onClickExit: () => void }) {
  const [muteBGM, setMuteBGM] = useState(false);
  const [muteEffectSound, setMuteEffectSound] = useState(false);

  useLayoutEffect(() => {
    const b = window.electron.store.get('muteBGM');
    const e = window.electron.store.get('muteEffectSound');
    setMuteBGM(b);
    setMuteEffectSound(e);
  }, []);

  useEffect(() => {
    window.electron.store.set('muteBGM', muteBGM);
  }, [muteBGM]);
  useEffect(() => {
    window.electron.store.set('muteEffectSound', muteEffectSound);
  }, [muteEffectSound]);

  return (
    <div className="flex-center">
      <h1>Option</h1>
      mute BGM
      <input
        type="checkbox"
        checked={muteBGM}
        onChange={() => setMuteBGM((prev) => !prev)}
      />
      mute Effect Sound
      <input
        type="checkbox"
        checked={muteEffectSound}
        onChange={() => setMuteEffectSound((prev) => !prev)}
      />
      <button type="button" onClick={onClickExit}>
        Exit
      </button>
    </div>
  );
}
