import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ingredient } from '@/lib/actions';

interface MVPIngredientsProps {
  ingredients: Ingredient[];
}

const MVPIngredients = ({ ingredients }: MVPIngredientsProps) => {
  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏆 Flavor Champions
        </CardTitle>
        <CardDescription>
          The ingredients that made the biggest splash in the pot
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ingredients.map((ingredient, index) => (
            <div key={ingredient.name} className="flex items-center justify-between p-4 bg-gradient-to-r from-[#FAF7F2] to-[#F5EDE3] dark:from-[#2E2822] dark:to-[#3A3228] rounded-xl border border-broth-amber/20">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-broth-amber text-white rounded-full font-bold text-sm font-serif">
                  {index + 1}
                </div>
                <div>
                  <div className="font-semibold">{ingredient.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Joined on Day {ingredient.addedDay}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="mb-1 bg-herb-green/10 text-herb-green border-herb-green/30">
                  +{ingredient.impact} impact
                </Badge>
                <div className="text-xs text-muted-foreground">
                  {ingredient.timesAdded} times added
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-gradient-accent rounded-lg text-accent-foreground">
          <h4 className="font-semibold font-serif mb-2">🏆 Hall of Fame</h4>
          <p className="text-sm opacity-90">
            These ingredients have proven their worth by consistently elevating
            the stew&apos;s rating the day after being added.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MVPIngredients;
