type MainMenuProps = {
  ipAddrInput: string;
  setIpAddrInput: (value: string) => void;
  servingPortInput: string;
  setServingPortInput: (value: string) => void;
  onClickMultiplay: (isHost: boolean) => void;
  onClickEditProfile: () => void;
};
export function MainMenu({
  ipAddrInput,
  setIpAddrInput,
  servingPortInput,
  setServingPortInput,
  onClickMultiplay,
  onClickEditProfile,
}: MainMenuProps) {
  return (
    <div>
      <h1>Pigscape</h1>
      <button type="button" onClick={() => onClickMultiplay(true)}>
        Create Multiplayer(Host)
      </button>
      <input
        type="text"
        placeholder="port (default: 20058)"
        maxLength={10}
        value={servingPortInput}
        onChange={({ target }) => {
          setServingPortInput(target.value);
        }}
        style={{ width: '150px', height: '20px', fontSize: '15px' }}
      />
      <br />
      <br />
      <div className="row">
        <button type="button" onClick={() => onClickMultiplay(false)}>
          Join
        </button>
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
          style={{ width: '200px', height: '20px', fontSize: '15px' }}
        />
      </div>
      {['localhost:20058', 'jewelry.tplinkdns.com:20058'].map((server) => (
        <button
          key={server}
          type="button"
          onClick={() => setIpAddrInput(server)}
        >
          {server}
        </button>
      ))}
      <br />
      <br />
      <button type="button" onClick={onClickEditProfile}>
        Edit profile
      </button>
    </div>
  );
}
