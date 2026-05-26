# Admin Page Spec

## Purpose

Admin interface for creating and managing store layouts, shelves, and products.

## Referenced Screens

- `admin-1.png`
- `admin-2.png`
- `admin-3.png`
- `admin-4.1.png`
- `admin-4.2.png`
- `admin-4.3.png`

## User Happy Path

1. The user opens the admin interface.
2. The user creates a new layout.
3. The user adds shelves to the layout.
4. The user adds products to shelf sections.
5. The user reviews the grid and adjusts positions if needed.

## UI Behaviors

- Header toolbar supports zoom in/out, full screen, center grid, and layout download.
- Left sidebar contains creation tools and utility actions.
- Main grid is interactive and supports drag-and-drop positioning.
- The interface is responsive and uses HeroUI plus Tailwind CSS.

## Interaction Details

**🎯 Admin Interface (admin-1.png)**

- **Header Toolbar**: Zoom in/out, full screen, center grid, download layout
- **Left Sidebar**: Logo, creation tools (Novo layout, Nova estante, Novo produto), and utility tools
- **Main Grid**: Interactive dotted grid with drag-and-drop functionality for layout items
- **Responsive Design**: Modern UI built with Tailwind CSS

**🏪 Layout Management (admin-2.png)**

- Create new store layouts with customizable dimensions
- Set layout name, description, and size (x, y coordinates)
- Support for both meters and pixels for precise positioning

**🗄️ Shelf Management (admin-3.png)**

- Add shelves to layouts with specific positions and dimensions
- Configure number of racks and sections per shelf
- Visual representation on the grid with drag-and-drop positioning

**📦 Product Management (admin-4.1.png, admin-4.2.png, admin-4.3.png)**

- Add products to specific shelf sections
- Product details: name, brand, description
- Automatic rack and section selection based on shelf structure

**🎨 Interactive Grid**

- Dotted grid background for precise positioning
- Drag-and-drop functionality for all layout items
- Zoom controls for detailed editing
- Visual feedback with hover and selection states

## Important Notes

- Image order reflects the intended happy path.
- Keep future additions in numeric order to preserve parseability.
