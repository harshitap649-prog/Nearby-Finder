// Mock database for places
const placesDatabase = {
    food: [
        {
            id: 1,
            name: "The Daily Grind",
            category: "food",
            icon: "🍕",
            rating: 4.8,
            reviews: 234,
            distance: 1.2,
            status: "Open Now",
            image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400",
            address: "123 Main Street, Downtown",
            phone: "+1 (555) 123-4567",
            website: "https://dailygrind.example.com",
            description: "A cozy coffee shop serving artisanal coffee and fresh pastries. Perfect for your morning routine or afternoon break.",
            about: "The Daily Grind has been serving the community since 2015. We source our beans from local roasters and our pastries are baked fresh every morning.",
            photos: [
                "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
                "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",
                "https://images.unsplash.com/photo-1511927030526-5e5db7b8941c?w=800"
            ],
            userReviews: [
                {
                    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40",
                    name: "Sarah Johnson",
                    rating: 5,
                    comment: "This is very short comment of short comment",
                    date: "2 days ago"
                },
                {
                    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40",
                    name: "Mike Chen",
                    rating: 4,
                    comment: "This is another review",
                    date: "1 week ago"
                },
                {
                    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40",
                    name: "Emily Davis",
                    rating: 5,
                    comment: "Great coffee and amazing atmosphere! The staff is always friendly and the pastries are to die for.",
                    date: "2 weeks ago"
                }
            ]
        },
        {
            id: 2,
            name: "Bella Italia",
            category: "food",
            icon: "🍕",
            rating: 4.6,
            reviews: 189,
            distance: 2.1,
            status: "Open Now",
            image: "https://images.unsplash.com/photo-1555992335-0e4f0b57b3a6?w=400",
            address: "456 Oak Avenue",
            phone: "+1 (555) 987-6543",
            website: "https://bellaitalia.example.com",
            description: "Authentic Italian cuisine with a modern twist. Family-owned restaurant serving traditional recipes passed down through generations.",
            about: "Bella Italia brings the taste of Italy to your neighborhood. Our chef trained in Rome and brings authentic techniques to every dish.",
            photos: [
                "https://images.unsplash.com/photo-1555992335-0e4f0b57b3a6?w=800",
                "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800"
            ],
            userReviews: [
                {
                    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40",
                    name: "Robert Smith",
                    rating: 5,
                    comment: "Best pasta in town!",
                    date: "3 days ago"
                }
            ]
        }
    ],
    hotels: [
        {
            id: 3,
            name: "Grand Plaza Hotel",
            category: "hotels",
            icon: "🏨",
            rating: 4.7,
            reviews: 412,
            distance: 3.5,
            status: "Open Now",
            image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
            address: "789 Boulevard Street",
            phone: "+1 (555) 246-8135",
            website: "https://grandplaza.example.com",
            description: "Luxury hotel in the heart of the city with stunning views and world-class amenities.",
            about: "The Grand Plaza Hotel offers 5-star accommodation with panoramic city views, spa facilities, and fine dining restaurants.",
            photos: [
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
                "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800"
            ],
            userReviews: [
                {
                    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40",
                    name: "Lisa Anderson",
                    rating: 5,
                    comment: "Amazing service and beautiful rooms!",
                    date: "1 day ago"
                }
            ]
        }
    ],
    cafes: [
        {
            id: 4,
            name: "Artisan Coffee House",
            category: "cafes",
            icon: "☕",
            rating: 4.9,
            reviews: 167,
            distance: 0.8,
            status: "Open Now",
            image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
            address: "321 Elm Street",
            phone: "+1 (555) 369-2580",
            website: "https://artisancoffee.example.com",
            description: "Specialty coffee shop with expertly crafted drinks and cozy atmosphere.",
            about: "We roast our own beans and offer a variety of brewing methods. Our baristas are trained coffee experts.",
            photos: [
                "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",
                "https://images.unsplash.com/photo-1511927030526-5e5db7b8941c?w=800"
            ],
            userReviews: [
                {
                    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=40",
                    name: "David Wilson",
                    rating: 5,
                    comment: "Perfect coffee, perfect atmosphere",
                    date: "4 days ago"
                }
            ]
        }
    ],
    restrooms: [
        {
            id: 5,
            name: "City Center Restrooms",
            category: "restrooms",
            icon: "🚻",
            rating: 3.8,
            reviews: 45,
            distance: 0.5,
            status: "Open Now",
            image: "https://images.unsplash.com/photo-1584622657118-04e9e932ed5e?w=400",
            address: "Central Park Area",
            phone: "+1 (555) 147-2580",
            website: null,
            description: "Clean and well-maintained public restrooms in the city center.",
            about: "Public facilities maintained by the city department. Regular cleaning schedule throughout the day.",
            photos: [
                "https://images.unsplash.com/photo-1584622657118-04e9e932ed5e?w=400"
            ],
            userReviews: [
                {
                    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40",
                    name: "City Visitor",
                    rating: 4,
                    comment: "Clean and accessible",
                    date: "1 week ago"
                }
            ]
        }
    ],
    travel: [
        {
            id: 6,
            name: "Sunset Viewpoint",
            category: "travel",
            icon: "🌄",
            rating: 4.9,
            reviews: 523,
            distance: 5.2,
            status: "Open Now",
            image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
            address: "Mountain Road, 5km north",
            phone: "+1 (555) 258-1470",
            website: "https://sunsetview.example.com",
            description: "Breathtaking viewpoint perfect for watching sunsets and taking photos.",
            about: "Popular tourist destination with panoramic views of the city and surrounding landscape. Best visited during golden hour.",
            photos: [
                "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
                "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800"
            ],
            userReviews: [
                {
                    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40",
                    name: "Travel Enthusiast",
                    rating: 5,
                    comment: "Absolutely stunning views!",
                    date: "2 days ago"
                }
            ]
        }
    ],
    shopping: [
        {
            id: 7,
            name: "Fashion Boutique",
            category: "shopping",
            icon: "🛍️",
            rating: 4.5,
            reviews: 89,
            distance: 1.8,
            status: "Open Now",
            image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400",
            address: "567 Fashion Street",
            phone: "+1 (555) 852-9630",
            website: "https://fashionboutique.example.com",
            description: "Trendy clothing and accessories for the modern shopper.",
            about: "Curated selection of local and international brands. Personal styling services available.",
            photos: [
                "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800"
            ],
            userReviews: [
                {
                    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40",
                    name: "Fashion Lover",
                    rating: 4,
                    comment: "Great selection and service",
                    date: "3 days ago"
                }
            ]
        }
    ],
    emergency: [
        {
            id: 8,
            name: "Central Medical Center",
            category: "emergency",
            icon: "🚨",
            rating: 4.2,
            reviews: 156,
            distance: 2.3,
            status: "24/7",
            image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400",
            address: "999 Emergency Lane",
            phone: "911",
            website: "https://centralmedical.example.com",
            description: "Full-service emergency medical center available 24/7.",
            about: "Emergency room, urgent care, and ambulance services. Staffed with experienced medical professionals.",
            photos: [
                "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800"
            ],
            userReviews: [
                {
                    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40",
                    name: "Patient",
                    rating: 4,
                    comment: "Quick and professional care",
                    date: "1 day ago"
                }
            ]
        }
    ]
};

// Helper function to get all places
function getAllPlaces() {
    return Object.values(placesDatabase).flat();
}

// Helper function to get places by category
function getPlacesByCategory(category) {
    return placesDatabase[category] || [];
}
