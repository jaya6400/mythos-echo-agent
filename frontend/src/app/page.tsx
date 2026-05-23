import DashboardContainer from "@/components/DashboardContainer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col p-4 md:p-6 lg:p-8 max-w-7xl mx-auto justify-center">
      <div className="w-full flex-1 flex flex-col justify-center space-y-6">
        {/* Banner/Hero description */}
        <div className="text-center space-y-1 md:text-left">
          <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-accent-amber animate-pulse-glow" />
            <span>Mythos Echo Gateway Active</span>
          </div>
        </div>

        {/* Dashboard Grid */}
        <DashboardContainer />
      </div>
    </main>
  );
}
