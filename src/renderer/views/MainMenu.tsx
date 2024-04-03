type MainMenuProps = {
  ipAddrInput: string;
  setIpAddrInput: (value: string) => void;
  onClickMultiplay: (isHost: boolean) => void;
  onClickEditProfile: () => void;
};
export function MainMenu({
  ipAddrInput,
  setIpAddrInput,
  onClickMultiplay,
  onClickEditProfile,
}: MainMenuProps) {
  return (
    <div>
      <h1>Ice Escape</h1>
      <button type="button" onClick={() => onClickMultiplay(true)}>
        Create Multiplayer
      </button>
      <button type="button" onClick={() => onClickMultiplay(false)}>
        Join Multiplayer
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
      <br />
      {['localhost', 'jewelry.tplinkdns.com'].map((server) => (
        <button
          key={server}
          type="button"
          onClick={() => setIpAddrInput(server)}
        >
          {server}
        </button>
      ))}
      <br />
      <button type="button" onClick={onClickEditProfile}>
        edit player
      </button>
    </div>
  );
}
