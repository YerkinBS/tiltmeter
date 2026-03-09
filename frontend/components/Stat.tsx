interface StatProps {
  label: string;
  value: string | number;
}

export default function Stat({ label, value }: StatProps) {
  const rendered = String(value);

  return (
    <div className="stat">
      <p className="statLabel">{label}</p>
      <p className="statValue" title={rendered}>
        {rendered}
      </p>
    </div>
  );
}
