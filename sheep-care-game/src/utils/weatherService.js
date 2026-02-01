
// Open-Meteo API (Free, No Key)
const API_URL = "https://api.open-meteo.com/v1/forecast";

export const getWeather = async (lat = 25.0330, lon = 121.5654) => {
    try {
        const response = await fetch(`${API_URL}?latitude=${lat}&longitude=${lon}&current_weather=true&daily=sunrise,sunset&timezone=auto`);
        const data = await response.json();

        const code = data.current_weather.weathercode;
        const isDayRaw = data.current_weather.is_day; // 1 day, 0 night

        // Calculate Time of Day Status
        let timeStatus = 'day';
        let isDay = true;

        if (data.daily && data.daily.sunrise && data.daily.sunset) {
            const now = new Date();
            const sunrise = new Date(data.daily.sunrise[0]);
            const sunset = new Date(data.daily.sunset[0]);

            // Evening: Sunset - 1hr to Sunset + 1hr (Golden Hour)
            const eveningStart = new Date(sunset.getTime() - 60 * 60 * 1000);
            const eveningEnd = new Date(sunset.getTime() + 60 * 60 * 1000);

            if (now >= eveningStart && now <= eveningEnd) {
                timeStatus = 'evening';
                isDay = true; // Visually day-ish
            } else if (now < sunrise || now > eveningEnd) {
                timeStatus = 'night';
                isDay = false;
            } else {
                timeStatus = 'day';
                isDay = true;
            }
        } else {
            // Fallback if daily API fails
            if (isDayRaw === 0) {
                timeStatus = 'night';
                isDay = false;
            }
        }

        let weatherType = 'sunny';
        // (WMO Code Mapping)
        if (code >= 95) weatherType = 'storm';
        else if (code >= 71) weatherType = 'snow';
        else if (code >= 61) weatherType = 'rain';
        else if (code >= 51) weatherType = 'rain';
        else if (code >= 45) weatherType = 'cloudy';
        else if (code >= 1) weatherType = 'cloudy';

        return {
            type: weatherType,
            code: code,
            temp: data.current_weather.temperature,
            isDay: isDay,
            timeStatus: timeStatus // day, evening, night
        };

    } catch (error) {
        console.error("Weather fetch failed:", error);
        return { type: 'sunny', temp: 25, isDay: true, timeStatus: 'day' };
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
