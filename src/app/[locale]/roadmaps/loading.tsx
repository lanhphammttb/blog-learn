export default function RoadmapsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-24 lg:px-8 animate-pulse">
        <div className="mb-12 space-y-3">
          <div className="h-12 w-64 rounded-2xl bg-muted" />
          <div className="h-5 w-96 rounded-xl bg-muted" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-3xl border border-border bg-card p-8 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-muted" />
                <div className="space-y-2">
                  <div className="h-6 w-40 rounded-lg bg-muted" />
                  <div className="h-4 w-20 rounded-full bg-muted" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-4/5 rounded bg-muted" />
              </div>
              <div className="h-10 w-full rounded-2xl bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
