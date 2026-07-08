type Props = {
  monthlyLabel: string;
  monthlyTotal: string;
  nextChargeText: string;
  title: string;
  copy: string;
};

export function DashboardHero({
  copy,
  monthlyLabel,
  monthlyTotal,
  nextChargeText,
  title,
}: Props) {
  return (
    <section className="hero">
      <div>
        <p className="eyebrow">Sub Tracker</p>
        <h1>{title}</h1>
        <p className="hero-copy">{copy}</p>
      </div>
      <div className="hero-stat">
        <span>{monthlyLabel}</span>
        <strong>{monthlyTotal}</strong>
        <p>{nextChargeText}</p>
      </div>
    </section>
  );
}
