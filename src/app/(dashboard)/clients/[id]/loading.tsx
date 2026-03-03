export default function ClientDetailLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-9 w-48 rounded-lg bg-muted" />
          <div className="h-4 w-64 rounded bg-muted" />
        </div>
        <div className="h-10 w-48 rounded-xl bg-muted" />
      </div>
      <div className="space-y-4">
        <div className="h-10 w-64 rounded-xl bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
