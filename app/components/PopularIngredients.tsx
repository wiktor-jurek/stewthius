import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ingredient } from '@/lib/actions';

interface PopularIngredientsProps {
  ingredients: Ingredient[];
}

const PopularIngredients = ({ ingredients }: PopularIngredientsProps) => {
  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🥕 Popular Ingredients
        </CardTitle>
        <CardDescription>
          The most frequently added ingredients by popularity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {ingredients.map((ingredient, index) => (
            <div key={ingredient.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="text-xl font-bold text-muted-foreground">
                  #{index + 1}
                </div>
                <div>
                  <div className="font-medium text-sm">{ingredient.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Day {ingredient.addedDay}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="mb-1">
                  {ingredient.popularity}%
                </Badge>
                <div className="text-xs text-muted-foreground">
                  +{ingredient.impact}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gradient-accent rounded-lg text-accent-foreground">
          <h4 className="font-semibold mb-2">📊 Popularity Metrics</h4>
          <p className="text-sm opacity-90">
            Popularity is calculated based on frequency of additions across all stew updates. 
            Impact shows the average rating change the day after addition.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PopularIngredients;