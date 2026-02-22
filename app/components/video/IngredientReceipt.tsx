import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DayIngredient } from '@/lib/actions';
import { getIngredientIcon } from '@/lib/utils';
import Link from 'next/link';

interface IngredientReceiptProps {
  ingredients: DayIngredient[];
  day: number;
}

const prepStyleIcons: Record<string, string> = {
  Raw: '🥬',
  Roasted: '🔥',
  'Sautéed': '🍳',
  Boiled: '♨️',
  Leftover: '📦',
  Scrap: '🗑️',
  Jarred: '🫙',
  Fried: '🍳',
  Grilled: '🔥',
  Smoked: '💨',
  Steamed: '♨️',
  Braised: '🫕',
  Baked: '🔥',
  Pickled: '🥒',
  Dried: '🌬️',
  Canned: '🥫',
  Frozen: '🧊',
  Marinated: '🫗',
  Fermented: '🧪',
  Powdered: '✨',
  Caramelized: '🍬',
  Cured: '🧂',
  Mashed: '🥄',
  Confit: '🫕',
  Blanched: '♨️',
  Poached: '♨️',
  Infused: '🫖',
};

export default function IngredientReceipt({ ingredients, day }: IngredientReceiptProps) {
  const grouped = ingredients.reduce<Record<string, DayIngredient[]>>((acc, ing) => {
    (acc[ing.category] ??= []).push(ing);
    return acc;
  }, {});

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧾 What Went In
        </CardTitle>
        <CardDescription>
          Day {day}&apos;s ingredient additions, the full receipt
        </CardDescription>
      </CardHeader>
      <CardContent>
        {ingredients.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Nothing was added to the pot today.
          </p>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  {category}
                </div>
                <div className="space-y-2">
                  {items.map((item, i) => {
                    const slug = item.name.toLowerCase().replace(/\s+/g, '-');
                    return (
                      <div
                        key={`${item.name}-${i}`}
                        className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border border-border/30 hover:border-broth-amber/30 transition-colors"
                      >
                        <span className="text-lg shrink-0">
                          {getIngredientIcon(item.name)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/ingredient/${slug}`}
                              className="font-medium text-sm hover:text-broth-amber transition-colors"
                            >
                              {item.name}
                            </Link>
                            <Badge variant="outline" className="text-xs gap-1">
                              <span>{prepStyleIcons[item.prepStyle] || '🍽️'}</span>
                              {item.prepStyle}
                            </Badge>
                          </div>
                          {item.comment && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              &ldquo;{item.comment}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-dashed border-border/50 text-center">
              <span className="text-xs text-muted-foreground">
                {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''} added
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
