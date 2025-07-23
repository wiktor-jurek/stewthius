import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Ingredient</TableHead>
              <TableHead className="w-24">Day First Added</TableHead>
              <TableHead className="w-24">Popularity</TableHead>
              <TableHead className="w-20 text-right">Impact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingredients.map((ingredient, index) => (
              <TableRow key={ingredient.name}>
                <TableCell>
                  <div className="text-lg font-bold text-muted-foreground">
                    #{index + 1}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{ingredient.name}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    Day {ingredient.addedDay}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {ingredient.popularity}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="text-sm font-medium text-green-600">
                    +{ingredient.impact}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
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