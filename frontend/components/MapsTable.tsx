import type { MapStats } from "@/lib/types";

interface MapsTableProps {
  maps: MapStats[];
}

export default function MapsTable({ maps }: MapsTableProps) {
  const topMapName = maps.length > 0 ? maps[0].map_name : null;
  const bottomMapName = maps.length > 1 ? maps[maps.length - 1].map_name : null;

  return (
    <section className="card">
      <div className="sectionHeader">
        <h3>Maps</h3>
        <p className="muted">Map-by-map performance split to reveal comfort picks and weak zones.</p>
      </div>
      {maps.length === 0 ? (
        <p className="emptyLine">No map stats yet.</p>
      ) : (
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Map</th>
                <th>Matches</th>
                <th>Wins</th>
                <th>Winrate</th>
                <th>Avg K/D</th>
                <th>Avg K</th>
                <th>Avg D</th>
                <th>Avg A</th>
              </tr>
            </thead>
            <tbody>
              {maps.map((map, index) => (
                <tr
                  key={map.map_name}
                  className={
                    index === 0 ? "rowHighlightTop" : map.map_name === bottomMapName ? "rowHighlightBottom" : ""
                  }
                >
                  <td className="mapCell" title={map.map_name}>
                    <span className="mapCellInline">
                      <span className="mapName">{map.map_name}</span>
                      {map.map_name === topMapName ? <span className="rowTag rowTagTop">Best</span> : null}
                      {map.map_name === bottomMapName ? <span className="rowTag rowTagBottom">Weakest</span> : null}
                    </span>
                  </td>
                  <td>{map.matches}</td>
                  <td>{map.wins}</td>
                  <td>{map.winrate}%</td>
                  <td>{map.avg_kd}</td>
                  <td>{map.avg_kills}</td>
                  <td>{map.avg_deaths}</td>
                  <td>{map.avg_assists}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
