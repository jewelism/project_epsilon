/* eslint-disable import/no-cycle */
import { useEffect, useState } from 'react';
import { MainMenu } from '@/views/MainMenu';
import EditProfile from '@/views/EditProfile';
import { MultiplayLobby } from '@/views/MultiplayLobby';
import './index.css';

export function Main() {
  const [currentView, setCurrentView] = useState('MainMenu');
  const [ipAddrInput, setIpAddrInput] = useState(
    window.electron.store.get('ipAddrInput') || 'localhost',
  );
  const [servingPortInput, setServingPortInput] = useState('');
  const [nickInput, setNickInput] = useState(
    window.electron.store.get('nick') || '',
  );
  const [frameNo, setFrameNo] = useState(
    parseInt(window.electron.store.get('frameNo') || '0', 10),
  );
  const [isHost, setIsHost] = useState(false);

  const onClickMultiplay = (host: boolean) => {
    if (host) {
      setIpAddrInput('localhost');
      window.electron.ipcRenderer.sendMessage(
        'server',
        Number(servingPortInput) || 20058,
      );
    }
    setIsHost(host);
    setCurrentView('MultiplayLobby');
    window.electron.store.set('ipAddrInput', ipAddrInput);
  };
  const onClickSaveProfile = () => {
    window.electron.store.set('nick', nickInput);
    window.electron.store.set('frameNo', frameNo.toString());
    setCurrentView('MainMenu');
  };

  useEffect(() => {
    if (!nickInput) {
      setCurrentView('EditProfile');
    }
  }, [nickInput]);

  return (
    <div id="menu_app">
      {currentView === 'MainMenu' && (
        <MainMenu
          {...{
            ipAddrInput,
            setIpAddrInput,
            servingPortInput,
            setServingPortInput,
            onClickMultiplay,
          }}
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
        />
      )}
      {currentView === 'MultiplayLobby' && (
        <MultiplayLobby
          isHost={isHost}
          nickInput={nickInput}
          frameNo={frameNo}
          ipAddrInput={ipAddrInput}
          servingPortInput={servingPortInput}
        />
      )}
    </div>
  );
}
