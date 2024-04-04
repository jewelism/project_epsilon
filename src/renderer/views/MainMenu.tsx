type MainMenuProps = {
  ipAddrInput: string;
  setIpAddrInput: (value: string) => void;
  portInput: number;
  setPortInput: (value: number) => void;
  onClickMultiplay: (isHost: boolean) => void;
  onClickEditProfile: () => void;
};
export function MainMenu({
  ipAddrInput,
  setIpAddrInput,
  portInput,
  setPortInput,
  onClickMultiplay,
  onClickEditProfile,
}: MainMenuProps) {
  return (
    <div>
      <h1>Ice Escape</h1>
      <button type="button" onClick={() => onClickMultiplay(true)}>
        Create Multiplayer(Host)
      </button>
      <br />
      <br />
      <input
        type="text"
        name="ipAddrInput"
        placeholder="enter ip address"
        maxLength={30}
        value={ipAddrInput}
        onChange={({ target }) => {
          setIpAddrInput(target.value);
        }}
        onFocus={() => {
          setIpAddrInput('');
        }}
      />
      <input
        type="number"
        name="portInput"
        placeholder="enter ip address"
        maxLength={30}
        value={portInput}
        onChange={({ target }) => {
          setPortInput(target.valueAsNumber);
        }}
        style={{ width: '80px', height: '20px', fontSize: '15px' }}
      />
      <br />
      {[
        { ip: 'localhost', port: 20058 },
        { ip: 'jewelry.tplinkdns.com', port: 20058 },
      ].map((server) => (
        <button
          key={server.ip}
          type="button"
          onClick={() => {
            setIpAddrInput(server.ip);
            setPortInput(server.port);
          }}
        >
          {server.ip}:{server.port}
        </button>
      ))}
      <br />
      <br />
      <button type="button" onClick={() => onClickMultiplay(false)}>
        Join Multiplayer
      </button>
      <br />
      <br />
      <button type="button" onClick={onClickEditProfile}>
        edit player
      </button>
    </div>
  );
}
