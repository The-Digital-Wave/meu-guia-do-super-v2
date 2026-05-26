# Client Page Spec

## Purpose

Client-facing supermarket navigation flow with store search, product search, layout grid, grocery list, and route optimization.

## Referenced Screens

- `client-1.png`
- `client-2.png`
- `client-3.png`
- `client-4.1.1.png`
- `client-4.1.2.png`
- `client-4.2.1.png`
- `client-4.2.2.png`
- `client-5.png`

## User Happy Path

1. The user opens the client page.
2. The user searches for a supermarket.
3. The user selects a supermarket and loads its layout on the grid.
4. The user searches for a product.
5. The user highlights the product location and sees the path from the current location pin.
6. The user adds items to the grocery list via the "Adicionar ao carrinho" button next to each list item.
7. The user runs route optimization for the selected list.
8. The user follows the suggested item order and checks items off while shopping.

## UI Behaviors

- Shelf rectangles show section names and hover modals with available stock.
- A blue circular location pin shows the customer position in real time.
- Search inputs use dynamic suggestions backed by database data.
- The header section has a menu with a few buttons (client-1.png):
- A magnifying glass button icon in an input with “Selecione um supermercado” placeholder, consisting of a dynamic input where a list of suggested supermarket name is dynamically rendered as the user types in (this list is fetched from a database)(client-2.png).
- When the user selects a supermarket on the list, its layout is loaded on the grid (client-3.png).
- Another dynamic input with “Selecione um produto” placeholder searches for an item in stock (client-4.1.1.png).
- When the user clicks on the item, its location on the layout is highlighted and a path from the location pin the item is drawn (like Google Maps)(client-4.2.1.png).
- Aligned to the right of each list item there's a chart-plus icon, where the user can add the item to the chart (client-4.2.1.png), placed at the bottom right right next to a floating button which the user can toggle one’s grocery list modal visiblity (client-4.2.2.png).
- A magic icon button called "Otimizar" (client-5.png). The purpose of this section is, given the list of items in the Favorites modal, to optimize the customer path inside the supermarket so one walks the least distance to pick up all their grocery items (you may implement a sorting algorithm like Djikistra or A\* to optimize the customer's path).
- While the optimization runs, a loader icon with a dark shade layout fills in the whole page to indicate the loading state. Once the optimization algorithm has run, each item location is presented in sequential order and after the customer picks the respective item, he has the possibility of checking the item off the Favorites list.

## Interaction Details

- Supermarket search loads the corresponding layout on selection.
- Product search filters items in stock and allows direct item addition.
- Optimization should support a shortest-path strategy such as Dijkstra or A\*.
- After optimization, items are presented in sequence for collection.

## Important Notes

- Preserve the happy-path order in the image filenames.
- If additional states are added later, document loading, empty, and error behaviors explicitly.
