const data = [
    {
        id: "1",
        name: "Soup",
        description: "Delicious homemade soups",
        imageUrl: "/placeholder.svg?height=100&width=100",
        items: [
            { id: "101", name: "Chicken Stock", description: "Base for chicken soup", price: 3.99, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "102", name: "Carrots", description: "Fresh organic carrots", price: 1.99, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "103", name: "Celery", description: "Crisp green celery", price: 2.49, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "104", name: "Onions", description: "Sweet yellow onions", price: 1.49, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "105", name: "Bay Leaves", description: "Aromatic bay leaves", price: 3.29, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "101", name: "Chicken Stock", description: "Base for chicken soup", price: 3.99, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "102", name: "Carrots", description: "Fresh organic carrots", price: 1.99, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "103", name: "Celery", description: "Crisp green celery", price: 2.49, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "104", name: "Onions", description: "Sweet yellow onions", price: 1.49, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "105", name: "Bay Leaves", description: "Aromatic bay leaves", price: 3.29, imageUrl: "/placeholder.svg?height=80&width=80" },
        ],
    },
    {
        id: "2",
        name: "Pasta",
        description: "Italian pasta dishes",
        imageUrl: "C:\\Users\\Kobby\\Downloads\\IMG_9525-2.webp",
        items: [
            { id: "201", name: "Spaghetti", description: "Dried spaghetti pasta", price: 2.99, imageUrl: "C:\\Users\\Kobby\\Downloads\\20cwkcgs__86111.jpg" },
            { id: "202", name: "Tomato Sauce", description: "Homemade tomato sauce", price: 4.99, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "203", name: "Parmesan", description: "Aged parmesan cheese", price: 6.99, imageUrl: "/placeholder.svg?height=80&width=80" },
        ],
    },
    {
        id: "3",
        name: "Salad",
        description: "Fresh garden salads",
        imageUrl: "/placeholder.svg?height=100&width=100",
        items: [
            { id: "301", name: "Lettuce", description: "Crisp romaine lettuce", price: 2.49, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "302", name: "Tomatoes", description: "Ripe cherry tomatoes", price: 3.99, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "303", name: "Cucumber", description: "Fresh cucumber", price: 1.79, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "304", name: "Vinaigrette", description: "Balsamic vinaigrette", price: 4.99, imageUrl: "/placeholder.svg?height=80&width=80" },
        ],
    },
    {
        id: "4",
        name: "Burgers",
        description: "Juicy grilled burgers",
        imageUrl: "https://example.com/burger.jpg",
        items: [
            { id: "401", name: "Beef Burger", description: "Grilled beef patty with lettuce and tomato", price: 5.99, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "402", name: "Cheese Burger", description: "Beef patty with melted cheddar", price: 6.49, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "403", name: "Veggie Burger", description: "Plant-based patty with avocado", price: 5.29, imageUrl: "/placeholder.svg?height=80&width=80" },
        ],
    },
    {
        id: "5",
        name: "Pizza",
        description: "Authentic Italian pizza",
        imageUrl: "https://example.com/pizza.jpg",
        items: [
            { id: "501", name: "Margherita", description: "Classic tomato and mozzarella", price: 9.99, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "502", name: "Pepperoni", description: "Spicy pepperoni slices", price: 10.99, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "503", name: "BBQ Chicken", description: "Grilled chicken with BBQ sauce", price: 11.49, imageUrl: "/placeholder.svg?height=80&width=80" },
        ],
    },
    {
        id: "6",
        name: "Seafood",
        description: "Fresh from the ocean",
        imageUrl: "https://example.com/seafood.jpg",
        items: [
            { id: "601", name: "Salmon", description: "Grilled salmon filet", price: 12.99, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "602", name: "Shrimp", description: "Garlic butter shrimp", price: 10.99, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "603", name: "Lobster", description: "Steamed lobster tail", price: 15.99, imageUrl: "/placeholder.svg?height=80&width=80" },
        ],
    },
    {
        id: "7",
        name: "Desserts",
        description: "Sweet treats",
        imageUrl: "https://example.com/desserts.jpg",
        items: [
            { id: "701", name: "Chocolate Cake", description: "Rich and moist", price: 4.99, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "702", name: "Cheesecake", description: "Creamy New York style", price: 5.49, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "703", name: "Ice Cream", description: "Vanilla, chocolate, or strawberry", price: 3.99, imageUrl: "/placeholder.svg?height=80&width=80" },
        ],
    },
    {
        id: "8",
        name: "Beverages",
        description: "Refreshing drinks",
        imageUrl: "https://example.com/beverages.jpg",
        items: [
            { id: "801", name: "Cola", description: "Classic fizzy drink", price: 1.99, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "802", name: "Orange Juice", description: "Freshly squeezed", price: 2.49, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "803", name: "Coffee", description: "Rich brewed coffee", price: 2.99, imageUrl: "/placeholder.svg?height=80&width=80" },
        ],
    },
    {
        id: "8",
        name: "Beverages",
        description: "Refreshing drinks",
        imageUrl: "https://example.com/beverages.jpg",
        items: [
            { id: "801", name: "Cola", description: "Classic fizzy drink", price: 1.99, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "802", name: "Orange Juice", description: "Freshly squeezed", price: 2.49, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "803", name: "Coffee", description: "Rich brewed coffee", price: 2.99, imageUrl: "/placeholder.svg?height=80&width=80" },
        ],
    },
    {
        id: "8",
        name: "Beverages",
        description: "Refreshing drinks",
        imageUrl: "https://example.com/beverages.jpg",
        items: [
            { id: "801", name: "Cola", description: "Classic fizzy drink", price: 1.99, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "802", name: "Orange Juice", description: "Freshly squeezed", price: 2.49, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "803", name: "Coffee", description: "Rich brewed coffee", price: 2.99, imageUrl: "/placeholder.svg?height=80&width=80" },
        ],
    },
    {
        id: "8",
        name: "Beverages",
        description: "Refreshing drinks",
        imageUrl: "https://example.com/beverages.jpg",
        items: [
            { id: "801", name: "Cola", description: "Classic fizzy drink", price: 1.99, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "802", name: "Orange Juice", description: "Freshly squeezed", price: 2.49, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "803", name: "Coffee", description: "Rich brewed coffee", price: 2.99, imageUrl: "/placeholder.svg?height=80&width=80" },
        ],
    },
    {
        id: "8",
        name: "Beverages",
        description: "Refreshing drinks",
        imageUrl: "https://example.com/beverages.jpg",
        items: [
            { id: "801", name: "Cola", description: "Classic fizzy drink", price: 1.99, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "802", name: "Orange Juice", description: "Freshly squeezed", price: 2.49, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "803", name: "Coffee", description: "Rich brewed coffee", price: 2.99, imageUrl: "/placeholder.svg?height=80&width=80" },
        ],
    },
    {
        id: "8",
        name: "Beverages",
        description: "Refreshing drinks",
        imageUrl: "https://example.com/beverages.jpg",
        items: [
            { id: "801", name: "Cola", description: "Classic fizzy drink", price: 1.99, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "802", name: "Orange Juice", description: "Freshly squeezed", price: 2.49, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "803", name: "Coffee", description: "Rich brewed coffee", price: 2.99, imageUrl: "/placeholder.svg?height=80&width=80" },
        ],
    },
    {
        id: "8",
        name: "Beverages",
        description: "Refreshing drinks",
        imageUrl: "https://example.com/beverages.jpg",
        items: [
            { id: "801", name: "Cola", description: "Classic fizzy drink", price: 1.99, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "802", name: "Orange Juice", description: "Freshly squeezed", price: 2.49, imageUrl: "/placeholder.svg?height=80&width=80" },
            { id: "803", name: "Coffee", description: "Rich brewed coffee", price: 2.99, imageUrl: "/placeholder.svg?height=80&width=80" },
        ],
    },
];

// Add more categories (up to 20) in a similar structure...

export default data;
