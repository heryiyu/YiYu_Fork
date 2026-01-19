
// Open-Meteo API (Free, No Key)
const API_URL = "https://api.open-meteo.com/v1/forecast";

export const getWeather = async (lat = 25.0330, lon = 121.5654) => { // Default Taipei
    try {
        const response = await fetch(`${API_URL}?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await response.json();

        // Map WMO Weather Codes to our types
        // https://open-meteo.com/en/docs
        const code = data.current_weather.weathercode;
        const isDay = data.current_weather.is_day; // 1 day, 0 night

        let weatherType = 'sunny';

        if (code >= 95) weatherType = 'storm'; // Thunderstorm
        else if (code >= 71) weatherType = 'snow'; // Snow (71, 73, 75, 77, 85, 86)
        else if (code >= 61) weatherType = 'rain'; // Rain
        else if (code >= 51) weatherType = 'rain'; // Drizzle
        else if (code >= 45) weatherType = 'cloudy'; // Fog
        else if (code >= 1) weatherType = 'cloudy'; // Clouds (1, 2, 3)
        // 0 is clear sky (sunny)

        // Force night visual if is_day is 0? 
        // Or handle separately. Let's return both.
        return {
            type: weatherType,
            temp: data.current_weather.temperature,
            isDay: isDay === 1
        };

    } catch (error) {
        console.error("Weather fetch failed:", error);
        return { type: 'sunny', temp: 25, isDay: true }; // Fallback
    }
};

export const getUserLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            resolve(null); // Not supported
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
            },
            () => resolve(null) // Error/Denied -> use default
        );
    });
};

export const searchCity = async (cityName) => {
    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=zh&format=json`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            return {
                name: result.name, // Or result.name + ", " + result.country
                lat: result.latitude,
                lon: result.longitude
            };
        }
        return null; // Not found
    } catch (error) {
        console.error("City search failed:", error);
        return null;
    }
};
