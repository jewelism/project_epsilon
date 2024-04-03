import { useEffect, useState } from 'react';
import { MainMenu } from '@/views/MainMenu';
import EditProfile from '@/views/EditProfile';
import { MultiplayLobby } from '@/views/MultiplayLobby';
import './index.css';

export function Start() {
  const [currentView, setCurrentView] = useState('MainMenu');
  const [ipAddrInput, setIpAddrInput] = useState(
    localStorage.getItem('ipAddrInput') || 'localhost',
  );
  const [nickInput, setNickInput] = useState(
    localStorage.getItem('nick') || '',
  );
  const [frameNo, setFrameNo] = useState(
    parseInt(localStorage.getItem('frameNo') || '0', 10),
  );
  const [isHost, setIsHost] = useState(false);

  const onClickMultiplay = (host: boolean) => {
    localStorage.setItem('ipAddrInput', ipAddrInput);
    setIsHost(host);
    setCurrentView('MultiplayLobby');
  };
  const onClickSaveProfile = () => {
    localStorage.setItem('nick', nickInput);
    localStorage.setItem('frameNo', frameNo.toString());
    setCurrentView('MainMenu');
  };
  const onClickCancelProfile = () => {
    setCurrentView('MainMenu');
  };

  useEffect(() => {
    localStorage.setItem('ipAddrInput', ipAddrInput);
  }, [ipAddrInput]);

  return (
    <div id="menu_app">
      {currentView === 'MainMenu' && (
        <MainMenu
          ipAddrInput={ipAddrInput}
          setIpAddrInput={setIpAddrInput}
          onClickMultiplay={onClickMultiplay}
          onClickEditProfile={() => {
            setCurrentView('EditProfile');
          }}
        />
      )}
      {currentView === 'EditProfile' && (
        <EditProfile
          nickInput={nickInput}
          setNickInput={setNickInput}
          frameNo={frameNo}
          setFrameNo={setFrameNo}
          onClickSaveProfile={onClickSaveProfile}
          onClickCancelProfile={onClickCancelProfile}
        />
      )}
      {currentView === 'MultiplayLobby' && (
        <MultiplayLobby
          isHost={isHost}
          nickInput={nickInput}
          frameNo={frameNo}
          ipAddrInput={ipAddrInput}
        />
      )}
    </div>
  );
}
