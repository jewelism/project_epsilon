/* eslint-disable import/no-cycle */
import { useEffect, useState } from 'react';
import { MainMenu } from '@/views/MainMenu';
import { EditProfile } from '@/views/EditProfile';
import { MultiplayLobby } from '@/views/MultiplayLobby';
import { Option } from '@/views/Option';
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
      const port = Number(servingPortInput) || 20058;
      setIpAddrInput(`localhost:${port}`);
      window.electron.ipcRenderer.sendMessage('openServer', port);
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
          ipAddrInput={ipAddrInput}
          setIpAddrInput={setIpAddrInput}
          servingPortInput={servingPortInput}
          setServingPortInput={setServingPortInput}
          onClickMultiplay={onClickMultiplay}
          onClickEditProfile={() => {
            setCurrentView('EditProfile');
          }}
          onClickOption={() => {
            setCurrentView('Option');
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
          setCurrentView={setCurrentView}
        />
      )}
      {currentView === 'Option' && (
        <Option
          onClickExit={() => {
            setCurrentView('MainMenu');
          }}
        />
      )}
    </div>
  );
}
