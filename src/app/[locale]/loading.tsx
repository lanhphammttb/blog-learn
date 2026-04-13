export default function Loading() {
  return (
    <div className="relative isolate px-6 pt-14 lg:px-8 bg-background">
      <div className="mx-auto max-w-7xl py-12">
        {/* Hero skeleton */}
        <div className="text-center mb-24 space-y-4 animate-pulse">
          <div className="mx-auto h-7 w-48 rounded-full bg-muted" />
          <div className="mx-auto h-16 w-3/4 rounded-2xl bg-muted" />
          <div className="mx-auto h-6 w-1/2 rounded-xl bg-muted" />
          <div className="flex justify-center gap-4 pt-4">
            <div className="h-14 w-40 rounded-2xl bg-muted" />
            <div className="h-14 w-56 rounded-2xl bg-muted" />
          </div>
        </div>

        {/* Roadmap cards skeleton */}
        <div className="mb-24">
          <div className="mb-8 h-8 w-48 rounded-xl bg-muted animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl border border-border bg-card p-6 space-y-3 animate-pulse">
                <div className="h-5 w-20 rounded-full bg-muted" />
                <div className="h-7 w-3/4 rounded-lg bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-2/3 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>

        {/* Articles grid skeleton */}
        <div className="mb-8 h-8 w-40 rounded-xl bg-muted animate-pulse" />
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-3xl border border-border bg-card overflow-hidden animate-pulse">
              <div className="h-48 bg-muted" />
              <div className="p-6 space-y-3">
                <div className="h-4 w-20 rounded-full bg-muted" />
                <div className="h-6 w-3/4 rounded-lg bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-2/3 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
