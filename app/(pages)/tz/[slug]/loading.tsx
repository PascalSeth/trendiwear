export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero skeleton */}
      <div className="relative w-full bg-white">
        <div className="h-72 lg:h-96 w-full bg-stone-200 animate-pulse" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative -mt-20 bg-white rounded-3xl shadow-2xl border border-stone-100 p-8">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="flex flex-col sm:flex-row gap-6 items-start flex-1">
                <div className="w-32 h-32 rounded-2xl bg-stone-200 animate-pulse" />
                <div className="flex-1 space-y-4">
                  <div className="h-10 w-64 bg-stone-200 rounded animate-pulse" />
                  <div className="h-6 w-40 bg-stone-100 rounded animate-pulse" />
                  <div className="flex gap-3">
                    <div className="h-8 w-24 bg-stone-100 rounded-full animate-pulse" />
                    <div className="h-8 w-32 bg-stone-100 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-12 w-32 bg-stone-200 rounded-xl animate-pulse" />
                <div className="h-12 w-12 bg-stone-100 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-3xl p-6 border border-stone-100">
            <div className="h-6 w-24 bg-stone-200 rounded animate-pulse mb-4" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-stone-100 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-stone-100 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-stone-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-stone-100">
            <div className="h-6 w-32 bg-stone-200 rounded animate-pulse mb-4" />
            <div className="h-40 w-full bg-stone-100 rounded-2xl animate-pulse" />
          </div>
        </div>
        <div className="lg:col-span-8 space-y-8">
          <div>
            <div className="h-8 w-48 bg-stone-200 rounded animate-pulse mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-[3/4] bg-stone-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-stone-100">
            <div className="h-8 w-40 bg-stone-200 rounded animate-pulse mb-6" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-stone-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-stone-100 rounded animate-pulse" />
                  <div className="h-4 w-full bg-stone-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
