# DiscoverLocal - PWA Map Application

A progressive web application that helps users discover nearby places with real-time geolocation and Google Places API integration.

## Features Implemented

✅ **Browser Geolocation**: Uses `navigator.geolocation.getCurrentPosition()` to center the map exactly where the user is standing

✅ **Dynamic Fetching**: When users click radius buttons (5km, 10km, 45km), the app clears old pins and fetches new real data for that radius

✅ **Real Images**: Uses the `place.photos[0].getUrl()` method from Google Places API to show actual photos of shops

## Setup Instructions

1. **Get a Google Places API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the "Places API" and "Maps JavaScript API"
   - Create an API key with appropriate restrictions

2. **Update the API Key**:
   Replace `YOUR_API_KEY` in both files:
   - In `index.html` line 67
   - In `app.js` line 58 (commented, shows the API key location)

3. **Run the Application**:
   - Serve the files using a local web server (required for PWA functionality)
   - Open in a browser that supports geolocation
   - Allow location access when prompted

## How It Works

- **Geolocation**: On app load, requests user location and centers map
- **Dynamic Search**: Click radius buttons to search for places within that distance
- **Real Data**: Uses Google Places API to fetch actual restaurants, cafes, and points of interest
- **Photo Integration**: Displays real photos from Google Places when available
- **Distance Calculation**: Shows accurate distance from user's location to each place

## API Usage

The app uses the Google Places JavaScript library with the following search parameters:
- Location: User's current coordinates
- Radius: 5km, 10km, or 45km based on button selection
- Types: restaurant, cafe, food, point_of_interest

## Browser Compatibility

- Requires modern browser with geolocation support
- Works best on mobile devices with GPS
- PWA features available in supported browsers
