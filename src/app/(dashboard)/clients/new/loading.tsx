export default function NewClientLoading() {
  return (
    <div className="max-w-2xl animate-pulse">
      <div className="rounded-2xl border border-border/70 p-6 space-y-6">
        <div className="h-4 w-20 rounded bg-muted" />
        <div className="space-y-2">
          <div className="h-7 w-32 rounded bg-muted" />
          <div className="h-4 w-full max-w-md rounded bg-muted" />
        </div>
        <div className="space-y-4 max-w-md">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-muted" />
          ))}
        </div>
        <div className="h-10 w-full max-w-md rounded-xl bg-muted" />
      </div>
    </div>
  );
}
