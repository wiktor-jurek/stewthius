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
          🏆 MVP Ingredients
        </CardTitle>
        <CardDescription>
          Ingredients with the highest positive impact on stew ratings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ingredients.map((ingredient, index) => (
            <div key={ingredient.name} className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-amber-500 text-white rounded-full font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <div className="font-semibold">{ingredient.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Added on Day {ingredient.addedDay}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="mb-1 bg-green-100 text-green-800 border-green-300">
                  +{ingredient.impact} impact
                </Badge>
                <div className="text-xs text-muted-foreground">
                  {ingredient.popularity}% popular
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-gradient-accent rounded-lg text-accent-foreground">
          <h4 className="font-semibold mb-2">🏆 Hall of Fame</h4>
          <p className="text-sm opacity-90">
            These ingredients have proven their worth by consistently boosting the stew&apos;s rating the day after being added.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MVPIngredients;