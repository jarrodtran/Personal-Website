export function MetricText({
  text,
  metric,
}: {
  text: string;
  metric?: string;
}) {
  if (!metric) {
    return <>{text}</>;
  }

  const index = text.indexOf(metric);
  if (index === -1) {
    return (
      <>
        <span className="text-foreground font-medium">{metric}</span> {text}
      </>
    );
  }

  return (
    <>
      {text.slice(0, index)}
      <span className="text-foreground font-medium">{metric}</span>
      {text.slice(index + metric.length)}
    </>
  );
}
