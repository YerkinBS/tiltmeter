interface SearchBarProps {
  nickname: string;
  isLoading: boolean;
  onNicknameChange: (value: string) => void;
  onSubmit: () => void;
}

export default function SearchBar({ nickname, isLoading, onNicknameChange, onSubmit }: SearchBarProps) {
  return (
    <section className="searchCard">
      <div className="searchGrid">
        <input
          type="text"
          value={nickname}
          onChange={(event) => onNicknameChange(event.target.value)}
          placeholder="Enter Faceit nickname"
          className="searchInput"
          disabled={isLoading}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSubmit();
            }
          }}
        />
        <button type="button" className="searchButton" disabled={isLoading || nickname.trim().length === 0} onClick={onSubmit}>
          {isLoading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
    </section>
  );
}
