import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Ingredient } from '@/lib/actions';
import { getIngredientIcon } from '@/lib/utils';

interface PopularIngredientsProps {
  ingredients: Ingredient[];
}

const PopularIngredients = ({ ingredients }: PopularIngredientsProps) => {
  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🥕 The Staples
        </CardTitle>
        <CardDescription>
          The most frequently tossed-in ingredients, ranked by popularity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ingredient</TableHead>
              <TableHead className="w-24">First Appeared</TableHead>
              <TableHead className="w-24">Times Added</TableHead>
              <TableHead className="w-20 text-right">Impact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingredients.map((ingredient) => (
              <TableRow key={ingredient.name}>
                <TableCell>
                  <div className="font-medium flex items-center gap-2">
                    <span className="text-base">{getIngredientIcon(ingredient.name)}</span>
                    {ingredient.name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    Day {ingredient.addedDay}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {ingredient.timesAdded}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="text-sm font-medium text-herb-green">
                    +{ingredient.impact}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div className="mt-6 p-4 bg-gradient-accent rounded-lg text-accent-foreground">
          <h4 className="font-semibold font-serif mb-2">📊 Flavor Impact</h4>
          <p className="text-sm opacity-90">
            Shows how many times each ingredient has joined the pot. 
            Impact reflects the average rating change the day after addition.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PopularIngredients;
