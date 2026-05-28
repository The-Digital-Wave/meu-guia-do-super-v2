Can you guide me through the full strategy/implementation to make my application ready-to-use, meaning:

- Backend implementation (api routes, controller, service logic, repository access, models, prisma schema, migrations)
- Frontend implementation
- Web, server and database hosting (Render/Heroku/Hostinger/Netlify/Vercel/Modal ?? Choose the one you think has the best cost-benefit relation, prioritize the one with the most generous free tier)
- CI/CD pipeline implementation with GitHub Actions
- App deployment to Apple/Play store, as well as one compatible web browser

Use both the orchestration and the domain agents and their respective skills throughout the development process. Feel free if you need to create new agents or skills, just let me know in advance and document everything.

Just a reminder, we have already redefined backend stack to comply with mobile development, but the same work needs to be done for the frontend side (React Native + Expo + Tailwind + Zustand + Tanstack Query ?? I'll let you decide...), as the legacy code (web-based) was built in React/TypeScript.

Here's a summary of my retail indoor navigation app's user story for your reference (you may document this somewhere if you think it's relevant):

"The target audience of my application is the customers of supermarkets. As the customer of a large supermarket where we haven’t been yet, we often find ourselves spending countless hours in between aisles, running back and forth trying to find items from our grocery list among shelves. How practical would be if we had an app which showed us right where to go for each item on our grocery list, as well as optimized the order of items in our grocery list so we walk the least distance in the supermarket?

The goal is to display the customer's real-time geoloc on the supermarket using trilateration technique via bluetooth beacons placed placed evenly around the supermarket to cover its full area (although bluetooth beacons are the ultimate choice of technology for its accuracy and implementation cost benefits, you may propose another approach to develop this MVP). As the user searches for an item on the search bar, the app displays a path between the user and the shelf where the item is located on the supermarket layout.

The user also has the possibility of adding multiple items to his chart and clicking an Optimize grocery button. A sorting algorith (travelling salesman-inspired, like Djkistra) will sort the items in the list, in such a maner that the user walks the least distance to pick all items."

Don’t forget, ask me anything you need along the way in terms of design (theme, color palette, logos), stack choice, basically just any information you need to build this app and document all changes of stack, workflows, etc. in their respective .md files so project documentation stays up to date!
