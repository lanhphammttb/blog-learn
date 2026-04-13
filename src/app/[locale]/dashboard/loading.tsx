export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        {/* Header */}
        <div className="mb-12 space-y-2">
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="h-12 w-80 rounded-2xl bg-muted" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-3xl border border-border bg-card p-8 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-muted" />
                <div className="h-4 w-20 rounded bg-muted" />
              </div>
              <div className="h-12 w-16 rounded-xl bg-muted" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {/* Active paths */}
            <div className="space-y-4">
              <div className="h-8 w-40 rounded-xl bg-muted" />
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-6 p-6 rounded-3xl border border-border bg-card">
                  <div className="h-16 w-16 rounded-2xl bg-muted flex-shrink-0" />
                  <div className="flex-grow space-y-2">
                    <div className="h-5 w-48 rounded bg-muted" />
                    <div className="h-2 w-full rounded-full bg-muted" />
                  </div>
                  <div className="h-8 w-12 rounded bg-muted" />
                </div>
              ))}
            </div>
            {/* Chart */}
            <div className="h-64 rounded-3xl border border-border bg-card" />
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="rounded-3xl border border-border bg-card p-8 space-y-4">
              <div className="h-6 w-24 rounded bg-muted" />
              {[1, 2].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-muted" />
              ))}
            </div>
            <div className="rounded-3xl border border-border bg-card p-8 space-y-4">
              <div className="h-6 w-32 rounded bg-muted" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-muted" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
