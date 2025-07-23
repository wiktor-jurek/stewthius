import { Stats } from '@/lib/actions';

interface StewHeaderProps {
  stats: Stats;
}

const StewHeader = ({ stats }: StewHeaderProps) => {
  return (
    <div className="bg-gradient-primary text-primary-foreground p-8 rounded-lg shadow-warm mb-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="text-6xl animate-stew-bubble">🍲</div>
          <div>
            <h1 className="text-4xl font-bold mb-2">Perpetual Stew Analytics</h1>
            <p className="text-lg opacity-90">
              Tracking the evolution of the legendary perpetual stew
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">{stats.currentDay}</div>
            <div className="text-sm opacity-80">Current Day</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">{stats.currentRating}/10</div>
            <div className="text-sm opacity-80">Today&apos;s Rating</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">{stats.totalIngredients}</div>
            <div className="text-sm opacity-80">Total Ingredients</div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
          <p className="text-sm text-center opacity-90">
            Welcome to the data-driven analysis of the internet&apos;s most ambitious culinary experiment. 
            Each metric tells the story of community-driven flavor evolution.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StewHeader;