import { useState } from 'react';
import { MainMenu } from '@/views/MainMenu';
import EditProfile from '@/views/EditProfile';
import { MultiplayLobby } from '@/views/MultiplayLobby';
import './index.css';

export function Start() {
  const [currentView, setCurrentView] = useState('MainMenu');
  const [ipAddrInput, setIpAddrInput] = useState(
    localStorage.getItem('ipAddrInput') || 'localhost',
  );
  const [portInput, setPortInput] = useState(20058);
  const [nickInput, setNickInput] = useState(
    localStorage.getItem('nick') || '',
  );
  const [frameNo, setFrameNo] = useState(
    parseInt(localStorage.getItem('frameNo') || '0', 10),
  );
  const [isHost, setIsHost] = useState(false);

  const onClickMultiplay = (host: boolean) => {
    if (host) {
      setIpAddrInput('localhost');
      window.electron.ipcRenderer.sendMessage('server', portInput);
    }
    setIsHost(host);
    setCurrentView('MultiplayLobby');
    localStorage.setItem('ipAddrInput', ipAddrInput);
  };
  const onClickSaveProfile = () => {
    localStorage.setItem('nick', nickInput);
    localStorage.setItem('frameNo', frameNo.toString());
    setCurrentView('MainMenu');
  };
  const onClickCancelProfile = () => {
    setCurrentView('MainMenu');
  };

  return (
    <div id="menu_app">
      {currentView === 'MainMenu' && (
        <MainMenu
          ipAddrInput={ipAddrInput}
          setIpAddrInput={setIpAddrInput}
          portInput={portInput}
          setPortInput={setPortInput}
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
          portInput={portInput}
        />
      )}
    </div>
  );
}
