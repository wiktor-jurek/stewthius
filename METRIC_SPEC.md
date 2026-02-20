## /Stats page
1. The "Trash to Treasure" Ratio (or The Leftover Paradox)
The Question: Does adding literal garbage make the stew better?
How to get it: You have a prep_style enum that includes "Leftover" and "Scrap". You can join ingredient_additions with stew_analysis to see if days where Zak adds "Scraps" result in a higher or lower ratingOverall and creatorSentiment.
The Hook: "I wanted to know: is a perpetual stew actually a good way to use leftovers, or is Zak just ruining his soup with week-old pizza crusts? The data shows that whenever he adds 'Scraps', the soup's rating actually..."

2. The Stew Singularity (The Embedding "Vibe" Map)
The Question: What are the distinct "Eras" of the stew?
How to get it: You have vector(768) embeddings in video_summary_embeddings. If you run a simple K-means clustering algorithm or a t-SNE reduction on those vectors, you can visually group the videos.
The Hook: "Because we gave every video a 'vibe check' using embeddings, we can actually map the entire history of the stew. We found three distinct clusters: The 'Hearty Winter Broth' era, The 'Too Much Acid' dark ages, and this weird cluster way out in the corner where he just kept adding seafood and regret."

3. The Complexity Tipping Point (The Muddy Water Theorem)
The Question: At what point do too many ingredients make the stew taste like absolutely nothing?
How to get it: Compare ratingComplexity against ratingOverall. Is it a linear line going up, or is it a bell curve? You can also plot videoDay against ratingComplexity to see if the stew is just getting infinitely more complex, or if the flavors eventually cancel each other out.
The Hook: "Every chef knows that if you mix every color of paint together, you get brown. I wanted to see if the same applies to soup. Look at this chart: as the complexity rating goes up, the overall rating peaks at an 8/10, but then falls off a cliff. Zak flew too close to the sun."

4. Viral Ingredients vs. Tasty Ingredients (The Engagement Trap)
The Question: Does TikTok's algorithm prefer bad soup?
How to get it: Join your videos table (viewCount, likeCount, shareCount) with ingredient_additions and ingredients. Find the ingredientCategoryEnum that yields the highest average views, and compare it to the ingredientCategoryEnum that yields the highest ratingOverall.
The Hook: "Here is where Zak the Chef and Zak the TikToker are at war. The data shows that when Zak adds normal things like 'Root Veg' or 'Protein-Poultry', the stew tastes amazing—averaging a 9/10. But when he adds chaotic things from the 'Other' category, the taste rating drops to a 4, but his views absolutely skyrocket. TikTok literally rewards him for making worse soup."

5. The Clarity-Richness Matrix
The Question: Does a thick, murky soup taste better than a clear broth?
How to get it: Plot appearanceClarity against textureThickness, and color-code the dots based on creatorSentiment (Super Positive to Super Negative).
The Hook: "I noticed Zak kept talking about the texture of the broth. So I graphed the soup's thickness against its clarity. What we found is the 'Zone of Perfection'—if the soup is too clear, it's boring. If it's too thick, it's sludge. But right here in the middle... that's perpetual soup heaven."

## /Ingredient_id

### 1. The "Stew Contributions" Heatmap (When was it used?)

Just like a GitHub contribution graph, use a calendar heatmap to show exactly when an ingredient was active.

* **How it works:** Each square represents a day of the year. If Zak added the ingredient that day, the square is colored in.
* **The Nerd Flex:** You can color-code the squares based on `creatorSentiment` from your `stewAnalysis` table. A bright green square means he added it and loved the stew ("Super Positive"); a dark red square means he added it and the stew tasted like regret ("Super Negative").

### 2. The "Savior or Saboteur" Metric (Did it ruin the broth?)

You want to answer the ultimate question: *Is this ingredient helping or hurting?*

* **The Visualization:** A simple, bold "Win/Loss/Draw" bar or a prominent "Net Impact" number.
* **How to calculate it:** Compare the `ratingOverall` on the day the ingredient was added to the `ratingOverall` of the *previous* day's video.
* **Positive Delta (+1.5):** The ingredient was a Savior.
* **Negative Delta (-2.0):** The ingredient was a Saboteur.
* **Zero Delta:** It was just filler.


* **UI Idea:** List the "Top 3 Best Days" and "Top 3 Worst Days" this ingredient was added, linking directly to the TikTok videos (`tiktokUrl`) and pulling the `keyQuote` for that day.

### 3. The Flavor Footprint (Radar Chart)

If a user clicks on "Carrots," they should instantly know *how* carrots change the stew's vibe.

* **The Visualization:** A radar (spider) chart.
* **How it works:** Plot the averages of `ratingRichness`, `ratingComplexity`, `textureThickness`, and `appearanceClarity` for all the days this ingredient was added. Overlay this against the "Global Stew Average."
* **The Insight:** This instantly shows if an ingredient makes the stew notably thicker, clearer, or more complex than usual.

### 4. The "Prep Style" Breakdown (Donut Chart)

Since you specifically built a `prepStyleEnum`, you absolutely have to show it off.

* **The Visualization:** A clean donut chart showing the distribution of how this ingredient enters the pot.
* **The Insight:** Is he always throwing onions in `"Raw"`, or is he taking the time to `"Sauté"` or `"Roast"` them first? If it's a meat, is it usually a `"Leftover"`?

### 5. The "Usually Paired With" Network (Bonus Data Science)

* **The Visualization:** A mini cluster or list of 3-4 other ingredients.
* **How it works:** A simple SQL join to find which other ingredients share the most `analysisId`s in the `ingredientAdditions` table.
* **The Insight:** "When Zak adds Garlic, he also adds Onions 85% of the time."

## /day
1. The "Daily Delta" (The Stock Ticker)
When someone clicks on "Day 142," the very first thing they want to know is: Did today make the stew better or worse?

The Visualization: Large, bold, stock-market-style metrics showing the day-over-day change.

How it works: You fetch the ratingOverall, ratingRichness, and ratingComplexity for the current videoDay, and calculate the difference from videoDay - 1.

The UI Insight: Display the day's rating (e.g., "8.5/10") with a green arrow pointing up (+1.2) or a red arrow pointing down (-0.5). If Zak absolutely tanked the stew that day, flash a "Sabotaged" warning badge based on a severe drop in the ratingOverall.

2. The "What Went In" Receipt
Instead of a boring list, style the ingredient_additions like a slightly unhinged grocery receipt or an RPG inventory drop.

The Visualization: A clean card layout showing the ingredientName, the prepStyleEnum (represented by little icons—a flame for "Roasted," a trash can for "Scrap"), and the specific comment Zak made about that ingredient.

The Nerd Flex: Group them by ingredientCategoryEnum. Show the viewer that today was a heavily "Starch-Legume" day.

3. The Broth's Vital Signs
You have all these amazing 0-20 scale metrics (textureThickness, appearanceClarity, etc.) with their respective confidence scores.

The Visualization: A radar chart showing the stew's physical properties for this specific day overlaid as a solid color, with the "All-Time Average" as a dotted line behind it.

The Insight: A viewer can instantly see, "Oh wow, Day 142 was exceptionally murky (appearanceClarity is low) but incredibly complex." You can even use the ratingOverallConfidence to fade the opacity of the chart if the AI wasn't super sure about the extraction!

4. The "Vibe" Neighborhood (Vector Similarity)
This is where you get to show off your vector(768) embeddings to the audience.

The Visualization: A "Related Days" section, but instead of basing it on chronological order, you base it on mathematical vibe.

How it works: Use pgvector's cosine similarity operator (<=>) to find the 3 videos whose embeddings are closest to today's video.

The Insight: "This batch of stew tastes most similar to Day 42 (The Great Cabbage Incident) and Day 89 (The Week of Too Much Pork)." It proves that history repeats itself, even in soup.

5. The AI Sommelier Notes
Give the LLM's hard work a place to shine.

The Layout: Use a stylized blockquote for the keyQuote pulled directly from the transcript, followed by a "Sommelier's Tasting Notes" section that dumps the flavorProfileNotes and generalNotes. It contrasts the high-tech AI analysis with the absolute absurdity of a guy eating week-old hotdog soup.

6. The "Viral vs. Tasty" Disconnect
The Layout: A simple bar comparing the viewCount / likeCount percentile against the ratingOverall percentile.

The Insight: Highlights if a day was a "TikTok Hit but a Culinary Miss" (e.g., 2 million views, 3/10 rating) or a "Hidden Gem" (10k views, 10/10 rating).