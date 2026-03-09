import type { PlayerInfo } from "@/lib/types";

interface PlayerHeaderCardProps {
  player: PlayerInfo;
}

function normalizeFaceitUrl(url: string | null, nickname: string): string | null {
  if (!url) {
    return null;
  }

  const cleaned = url
    .replace("/%7Blang%7D/", "/en/")
    .replace("/{lang}/", "/en/")
    .replace("/%7Blang%7D", "/en")
    .replace("/{lang}", "/en");

  if (cleaned.includes("/players/")) {
    return cleaned;
  }

  return `https://www.faceit.com/en/players/${encodeURIComponent(nickname)}`;
}

export default function PlayerHeaderCard({ player }: PlayerHeaderCardProps) {
  const faceitProfileUrl = normalizeFaceitUrl(player.faceit_url, player.nickname);
  const country = player.country ? player.country.toUpperCase() : "Unknown";
  const region = player.region ? player.region.toUpperCase() : "Unknown region";

  return (
    <section className="card cardLarge">
      <div className="playerHeader">
        <div className="avatarWrap">
          {player.avatar ? (
            <img src={player.avatar} alt={`${player.nickname} avatar`} className="avatar" />
          ) : (
            <div className="avatar avatarFallback">{player.nickname.slice(0, 1).toUpperCase()}</div>
          )}
        </div>

        <div className="playerMain">
          <h2 title={player.nickname}>{player.nickname}</h2>
          <div className="mainStatsRow">
            <div className="headlineStat">
              <span className="headlineStatLabel">Faceit level</span>
              <strong>{player.skill_level ?? "N/A"}</strong>
            </div>
            <div className="headlineStat">
              <span className="headlineStatLabel">ELO</span>
              <strong>{player.faceit_elo ?? "N/A"}</strong>
            </div>
          </div>
          <div className="chipsRow">
            <span className="chip">{country}</span>
            <span className="chip">{region}</span>
          </div>
        </div>

        {faceitProfileUrl ? (
          <a className="primaryLink" href={faceitProfileUrl} target="_blank" rel="noreferrer">
            View Faceit Profile
          </a>
        ) : null}
      </div>
    </section>
  );
}
