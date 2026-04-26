1. Project title and description (what it does and who it's for)
- Recipe Finder
    - A web app that lets you search for recipes by dish name, ingredient, or cuisine. Built for anyone who wants quick meal inspiration without scrolling through food blogs; they just need to search, browse, and save what looks good to them. 

2. Live demo URL
- [https://sophimilian.github.io/recipe-finder/]

3. Features list (what users can do)
- Search recipes by keyword, ingredient, or cuisine
- Filter results by dietary preference (vegetatian, vegan, gluten-free)
- View full recipe details including ingredients and step-by-step instructions 
- Save favorite recipes to your browser (you do not need an account)
- Dark mode saves with preference 
- Fully responsive (works on both mobile app and desktop)


4. Technologies used
- HTML, CSS, JavaScript, Spoonacular API for the recipe data, fetch API for http requests, localStorage for saving recipes and theme preference, Google Fonts

5. AI tools used and how they helped
- CLAUDE and GitHub Copilot
    - both were used as coding assistants

6. Challenges faced and how you solved them
- The biggest challenge was getting ingredients and instructions to show in the recipe detail view. Initially, clicking a recipe only showed the title and the image (the ingredients and instructions were missing entirely). The root was that Spoonacular's search endpoint (/complexSearch) only returns basic recipe info like title, image, and cook time. Ingredients and instructions are not included in that response to save bandwidth. So, to fix this, I added a second API call to /recipes/{id}/information that fires when a user clicks on the recipe card. The detail overlay now loads with the basic info and then populates the full ingredients and instructions once that second fetch completes. 

7. Future improvements (what you would add with more time)
-  I would add a AI-powered "What can I cook" feature where the user can input ingredients they have at home and get matching recipe suggestions
- Nutritional info panel on recipe details page
- Meal planner view--drag recipes onto a weekly calendar
- Shopping list generator based on saved recipes 
