document.addEventListener("DOMContentLoaded", function() {
    var defaultCity = "Kolkata";
    getWeather(defaultCity);
    getCoordinates(defaultCity);
    getTomorrowForecast(defaultCity);
    searchCityUVIndex(defaultCity); // Fetch and update UV index for default city
    initializeMap(defaultCity); // Initialize the map with the default city

    var searchButton = document.getElementById("searchButton");
    var cityInput = document.getElementById("cityInput");

    // Search when button clicked
    searchButton.addEventListener("click", function() {
        var city = cityInput.value;
        if (city.trim() !== "") {
            getWeather(city);
            getCoordinates(city);
            getTomorrowForecast(city);
            searchCityUVIndex(city); // Fetch and update UV index for searched city
            updateMap(city); // Update map for searched city
        }
    });

    // Search when Enter key pressed
    cityInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            var city = cityInput.value;
            if (city.trim() !== "") {
                getWeather(city);
                getCoordinates(city);
                getTomorrowForecast(city);
                searchCityUVIndex(city); // Fetch and update UV index for searched city
                updateMap(city); // Update map for searched city
            }
        }
    });

    const overicon = document.querySelector(".Overicon");
    const icons = document.querySelectorAll(".Sidebar a");

    icons.forEach((icon) => {
        icon.addEventListener("click", function(event) {
            event.preventDefault(); // Prevent the default action of the anchor tag

            // Get the bounding rectangle of the clicked icon
            const iconRect = icon.getBoundingClientRect();
            const sidebarRect = document.querySelector(".Sidebar").getBoundingClientRect();

            // Calculate the new top position relative to the sidebar
            const newPosition = iconRect.top - sidebarRect.top;
            overicon.style.top = newPosition + "px";
        });

        
    });

    // const overicon = document.querySelector(".Overicon");
    // const icons = document.querySelectorAll(".Sidebar a");

    // icons.forEach((icon) => {
    //     icon.addEventListener("click", function(event) {
    //         event.preventDefault(); // Prevent the default action of the anchor tag

    //         // Get the bounding rectangle of the clicked icon
    //         const iconRect = icon.getBoundingClientRect();
    //         const sidebarRect = document.querySelector(".Sidebar").getBoundingClientRect();

    //         // Calculate the new top position relative to the sidebar
    //         const newPosition = iconRect.top - sidebarRect.top;
    //         overicon.style.top = newPosition + "px";
    //     });
    // });

    async function getForecast(lat, lon) {
        const apiKey = 'a2e9c4e128c0d0a65b3c008f12186ec7'; 
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            const forecastDiv = document.getElementById("forecast");
            forecastDiv.innerHTML = '';

            let days = {};
            data.list.forEach(item => {
                let date = new Date(item.dt * 1000);
                let day = date.toLocaleDateString("en-US", { weekday: "short" });
                if (!days[day]) {
                    days[day] = { temps: [], icon: item.weather[0].icon };
                }
                days[day].temps.push(item.main.temp);
            });

            let dayKeys = Object.keys(days).slice(0, 7); // Get next 7 days including today

            dayKeys.forEach(day => {
                let temps = days[day].temps.length > 0 ? Math.round(days[day].temps.reduce((a, b) => a + b) / days[day].temps.length) : "N/A";
                let iconUrl = `http://openweathermap.org/img/wn/${days[day].icon}.png`;

                let forecastBox = document.createElement("div");
                forecastBox.classList.add("forecast-day");
                forecastBox.innerHTML = `
                    <p class="date">${day}</p>
                    <img class="icon" src="${iconUrl}" alt="Weather Icon" onerror="this.src='images/default.png'">
                    <p class="temp">${temps}°C</p>
                `;
                forecastDiv.appendChild(forecastBox);
            });
        } catch (error) {
            console.error("Error fetching forecast data: ", error);
        }
    }

    async function getCoordinates(city) {
        const apiKey = 'a2e9c4e128c0d0a65b3c008f12186ec7'; 
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`);
            const data = await response.json();
            const { lat, lon } = data.coord;
            getForecast(lat, lon);
            getNearbyCitiesWeather(lat, lon); // Added call to fetch nearby cities
        } catch (error) {
            console.error('Error fetching coordinates:', error);
        }
    }

    async function getWeather(city) {
        const apiKey = 'a2e9c4e128c0d0a65b3c008f12186ec7';
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
            const data = await response.json();
            updateWeatherUI(data);
            updateSunInfo(city);
            getTodayForecast(city);
            updateHumidity(data.main.humidity);
            updateWindSpeed(data.wind.speed);
            getAQI(city);
            // getCoordinates(city); // Call getCoordinates from here if you want nearby cities on initial load too, or keep it separate
        } catch (error) {
            console.error('Error fetching weather data:', error);
        }
    }
    function updateWeatherUI(data) {
        document.querySelector('.Cityname').textContent = data.name;
        document.querySelector('.Temarature h1').textContent = `${Math.round(data.main.temp)}°C`;
        document.querySelector('.Condition h2').textContent = data.weather[0].main;
        document.querySelector('.Condition p').textContent = `Feels like ${Math.round(data.main.feels_like)}°C`;
    
        const date = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const day = days[date.getDay()];
        const formattedDate = `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    
        document.querySelector('.Dayandyear h2').textContent = day;
        document.querySelector('.Dayandyear p').textContent = formattedDate;
    
        const weatherCondition = data.weather[0].main.toLowerCase();
        const icon = document.querySelector('.Icon img');
    
        // Calculate city's local time
        const timezoneOffset = data.timezone; // timezone offset in seconds from UTC
        const localTime = new Date(date.getTime() + timezoneOffset * 1000);
        const hour = localTime.getUTCHours(); // Use UTC hours for consistency
    
        // Determine if it's day or night based on local time
        const isDaytime = hour >= 6 && hour < 18; // Assuming daytime is from 6 AM to 6 PM UTC
    
        const weatherIcons = {
            clear: isDaytime ? 'dayclear.png' : 'nightclear.png',
            clouds: isDaytime ? 'daycloudy.png' : 'nightcloudy.png',
            rain: isDaytime ? 'dayrain.png' : 'nightrainy.png',
            thunderstorm: isDaytime ? 'daythnderstorm.png' : 'nightthnderstorm.png',
            partly_cloudy: isDaytime ? 'daypartly_cloudy.png' : 'nightpartly_cloudy.png',
            snow: isDaytime ? 'daysnowy.png' : 'nightsnowy.png',
            haze: isDaytime ? 'dayhaze.png' : 'nighthaze.png',
            mist: isDaytime ? 'daymist.png' : 'nightmist.png'
        };
    
        icon.src = `images/${weatherIcons[weatherCondition] || 'default.png'}`;
    }
    function updateHumidity(humidity) {
        const humidityElement = document.querySelector('.Humidity h2');
        const statusElement = document.querySelector('.Humidity h4');

        humidityElement.textContent = `${humidity}%`;

        if (humidity < 30) {
            statusElement.textContent = "Low";
        } else if (humidity < 60) {
            statusElement.textContent = "Comfort";
        } else {
            statusElement.textContent = "High";
        }
    }

    async function getTodayForecast(city) {
        const apiKey = 'a2e9c4e128c0d0a65b3c008f12186ec7';
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            const today = new Date();
            const todayDateString = today.toISOString().split('T')[0];

            let maxTemp = -Infinity;
            let minTemp = Infinity;

            data.list.forEach(item => {
                if (item.dt_txt.startsWith(todayDateString)) {
                    maxTemp = Math.max(maxTemp, item.main.temp_max);
                    minTemp = Math.min(minTemp, item.main.temp_min);
                }
            });

            document.querySelector('.Highandlow p').textContent = `High: ${Math.round(maxTemp)}°C Low: ${Math.round(minTemp)}°C`;
        } catch (error) {
            console.error('Error fetching forecast data:', error);
        }
    }

    async function getTomorrowForecast(city) {
        const apiKey = 'a2e9c4e128c0d0a65b3c008f12186ec7';
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            const tomorrowDateString = tomorrow.toISOString().split('T')[0];

            const tomorrowForecast = data.list.find(item => item.dt_txt.startsWith(tomorrowDateString));

            if (tomorrowForecast) {
                const temp = Math.round(tomorrowForecast.main.temp);
                const weatherDescription = tomorrowForecast.weather[0].description;
                const weatherCondition = tomorrowForecast.weather[0].main.toLowerCase();

                const forecastDiv = document.querySelector(".Nextday");
                const cloudIconDiv = document.querySelector(".CloudIcon img");

                const weatherIcons = {
                    clear: 'dayclear.png',
                    clouds: 'daycloudy.png',
                    rain: 'dayrainy.png',
                    snow: 'daysnowy.png',
                    thunderstorm: 'daythunderstorm.png'
                };

                const iconSrc = `images/${weatherIcons[weatherCondition] || 'default.png'}`;

                forecastDiv.innerHTML = `
                    <p>Tomorrow</p>
                    <samp>${weatherDescription}</samp>
                    <h2>${temp}°</h2>
                `;

                cloudIconDiv.src = iconSrc;
                cloudIconDiv.alt = weatherDescription;
            } else {
                console.error('No forecast data available for tomorrow');
            }
        } catch (error) {
            console.error('Error fetching forecast data:', error);
        }
    }

    async function updateSunInfo(city) {
        const apiKey = 'a2e9c4e128c0d0a65b3c008f12186ec7';
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            const sunrise = new Date(data.sys.sunrise * 1000);
            const sunset = new Date(data.sys.sunset * 1000);

            const sunriseTime = formatTime(sunrise);
            const sunsetTime = formatTime(sunset);
    
            const lengthOfDayMinutes = Math.round((sunset - sunrise) / 60000);
            const hours = Math.floor(lengthOfDayMinutes / 60);
            const minutes = lengthOfDayMinutes % 60;
    
            document.querySelector('.Sunrise h2').innerHTML = `${sunriseTime}`;
            document.querySelector('.Sunset h2').innerHTML = `${sunsetTime}`;
            document.querySelector('.LengthOfDay h2').textContent = `${hours}h ${minutes}m`;
        } catch (error) {
            console.error('Error fetching sun information:', error);
        }
    }
    
    function formatTime(date) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const suffix = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        return `${formattedHours}:${formattedMinutes}<span class="time-suffix">${suffix}</span>`;
    }
    
    async function getUVIndex(city) {
        const apiKey = 'a2e9c4e128c0d0a65b3c008f12186ec7'; // Replace with your OpenWeatherMap API key
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
        
        try {
            // Get the city's weather data
            const weatherResponse = await fetch(weatherUrl);
            const weatherData = await weatherResponse.json();
            const { coord } = weatherData;
        
            // Get the UV index data
            const uvUrl = `https://api.openweathermap.org/data/2.5/uvi?lat=${coord.lat}&lon=${coord.lon}&appid=${apiKey}`;
            const uvResponse = await fetch(uvUrl);
            const uvData = await uvResponse.json();
            return uvData.value;
        } catch (error) {
            console.error('Error fetching UV index:', error);
            return null;
        }
    }
      
    function updateGauge(uvIndex) {
        const needle = document.querySelector('.needle');
        const label = document.querySelector('.gauge-center .label');
        const number = document.querySelector('.gauge-center .number');

        const roundedUVIndex = Math.round(uvIndex);
        
        let riskClass;
        let riskLevel;
        let rotation;
      
        if (uvIndex <= 2) {
            riskClass = 'rischio1';
            riskLevel = 'LOW';
            rotation = 16;
        } else if (uvIndex <= 5) {
            riskClass = 'rischio2';
            riskLevel = 'MODERATE';
            rotation = 65;
        } else if (uvIndex <= 7) {
            riskClass = 'rischio3';
            riskLevel = 'HIGH';
            rotation = 115;
        } else {
            riskClass = 'rischio4';
            riskLevel = 'VERY HIGH';
            rotation = 164;
        }
      
        // Update the needle animation
        needle.style.animation = `rotateNeedle 2s forwards`;
        needle.style.transform = `rotate(${rotation}deg)`;
        label.textContent = roundedUVIndex;
        number.textContent = riskLevel;
      
        // Update the gauge class
        document.querySelector('.gauge').className = `gauge four ${riskClass}`;
    }
      
    async function searchCityUVIndex(city) {
        const uvIndex = await getUVIndex(city);
        if (uvIndex !== null) {
            updateGauge(uvIndex);
        } else {
            alert('Unable to fetch UV index. Please try again.');
        }
    }


    // wind speed meter

    function updateWindSpeed(speed) {
        const windSpeedElement = document.getElementById("windSpeedValue");
        const windTimeElement = document.getElementById("windTime");
        const needle = document.getElementById("needle");

        windSpeedElement.textContent = `${speed.toFixed(2)} km/h`;

        const now = new Date();
        const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        windTimeElement.textContent = timeString;

        // Calculate rotation based on wind speed
        const maxSpeed = 100; // You can set this to the maximum wind speed you expect
        const rotation = (speed / maxSpeed) * 180; // Assuming the needle moves from 0 to 180 degrees

        // Apply rotation with animation
        needle.style.transition = 'transform 1s ease-out';
        needle.style.transform = `rotate(${rotation}deg)`;
    }
    
    // AQI
    async function getAQI(city) {
        const apiKey = 'a2e9c4e128c0d0a65b3c008f12186ec7'; // Replace with your actual API key
        try {
            // Fetch city coordinates
            const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`);
            const weatherData = await weatherResponse.json();
            const { coord } = weatherData;

            // Fetch AQI data
            const aqiResponse = await fetch(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${coord.lat}&lon=${coord.lon}&appid=${apiKey}`);
            const aqiData = await aqiResponse.json();
            const aqiValue = aqiData.list[0].main.aqi;
            updateAQI(aqiValue);
        } catch (error) {
            console.error('Error fetching AQI data:', error);
        }
    }

    function updateAQI(aqi) {
        const aqiElement = document.querySelector('.AQI h1');
        const statusElement = document.querySelector('.AQI h2');

        aqiElement.textContent = aqi;

        let status;
        if (aqi == 1) {
            status = "Good";
        } else if (aqi == 2) {
            status = "Fair";
        } else if (aqi == 3) {
            status = "Moderate";
        } else if (aqi == 4) {
            status = "Poor";
        } else if (aqi == 5) {
            status = "Very Poor";
        }

        statusElement.textContent = status;
    }

    function showSection(targetId) {
        document.querySelectorAll(".section").forEach(function(section) {
          if (section.id === targetId) {
            section.classList.add("section-visible");
          } else {
            section.classList.remove("section-visible");
          }
        });
    }
  
    document.querySelectorAll(".icon-link").forEach(function(icon) {
        icon.addEventListener("click", function(event) {
          event.preventDefault(); // Prevent default anchor behavior
          var target = icon.getAttribute("data-target");
  
          if (target === "map") {
            document.getElementById("mapbc").classList.add("mapbc-visible");
            setTimeout(function() { // Wait a bit before invalidating the size
              window.myMap.invalidateSize(); // Refresh the map size
            }, 100);
          } else {
            document.getElementById("mapbc").classList.remove("mapbc-visible");
          }
        });
    });
  
    function initializeMap(city) {
        var mapContainer = document.getElementById('map');
        var map = L.map(mapContainer).setView([20.5937, 78.9629], 5); // Initial center on India
  
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
  
        // Set maximum bounds to prevent map from repeating
        var southWest = L.latLng(-90, -180);
        var northEast = L.latLng(90, 180);
        var bounds = L.latLngBounds(southWest, northEast);
        map.setMaxBounds(bounds);
        map.on('drag', function() {
          map.panInsideBounds(bounds, { animate: false });
        });
  
        var marker; // Declare a marker variable
  
        // Store the map and marker in global variables to update them later
        window.myMap = map;
        window.myMarker = marker;
  
        // Update the map for the default city
        updateMap(city);
    }
  
      async function updateMap(city) {
        const apiKey = 'a2e9c4e128c0d0a65b3c008f12186ec7';
        try {
          const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
          const data = await response.json();
          const { lat, lon } = data.coord;
          const temperature = Math.round(data.main.temp); // Get the temperature
  
          // Update the map view to the searched city
          window.myMap.setView([lat, lon], 10);
  
          // If a marker already exists, remove it
          if (window.myMarker) {
            window.myMap.removeLayer(window.myMarker);
          }
  
          // Add a new marker for the searched city with the temperature and icon in the popup
          window.myMarker = L.marker([lat, lon]).addTo(window.myMap)
            .bindPopup(`
              <div class="popup-content">
                <span>${temperature}°C</span><br>
                <b>${data.name}</b>
              </div>
            `).openPopup();
        } catch (error) {
          console.error('Error updating map:', error);
        }
    }

    document.querySelectorAll(".icon-link").forEach(function(icon) {
        icon.addEventListener("click", function(event) {
            event.preventDefault(); // Prevent default anchor behavior
            var target = icon.getAttribute("data-target");
            var calendar = document.querySelector(".calendar");
    
            if (target === "calendar") {
                // If the calendar is already visible, do nothing
                if (!calendar.classList.contains("calendar-visible")) {
                    calendar.style.visibility = "visible";
                    setTimeout(function() {
                        calendar.classList.add("calendar-visible");
                    }, 10); // Small delay to ensure visibility is set before height animation starts
                }
            } else {
                // Hide the calendar if a different icon is clicked
                if (calendar.classList.contains("calendar-visible")) {
                    calendar.classList.remove("calendar-visible");
                    setTimeout(function() {
                        calendar.style.visibility = "hidden";
                    }, 500); // Wait for the animation to finish before setting visibility to hidden
                }
            }
        });
    });
});


// const signUpButton = document.getElementById('signUp');
// const signInButton = document.getElementById('signIn');
// const container = document.getElementById('container');

// signUpButton.addEventListener('click', () => {
// 	container.classList.add("right-panel-active");
// });

// signInButton.addEventListener('click', () => {
// 	container.classList.remove("right-panel-active");
// });

document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.getElementById('loginButton');
    const signInSignUp = document.querySelector('.signINsignUP');
  
    loginButton.addEventListener('click', function() {
      signInSignUp.classList.toggle('expanded');
    });
  });


    // New function to update UI for a single nearby city
    function updateNearbyCityUI(data, cityDivClass) {
        const cityElement = document.querySelector(`.${cityDivClass}`);
        if (cityElement) {
            cityElement.querySelector('h1').textContent = `${Math.round(data.main.temp)}°`;
            cityElement.querySelector('p').textContent = `H ${Math.round(data.main.temp_max)}° L ${Math.round(data.main.temp_min)}°`;
            cityElement.querySelector('h2').textContent = data.name;

            const weatherCondition = data.weather[0].main.toLowerCase();
            const iconElement = cityElement.querySelector('.Icon img');
            const date = new Date();
            const timezoneOffset = data.timezone; // timezone offset in seconds from UTC
            const localTime = new Date(date.getTime() + timezoneOffset * 1000);
            const hour = localTime.getUTCHours(); // Use UTC hours for consistency
            const isDaytime = hour >= 6 && hour < 18;

            const weatherIcons = {
                clear: isDaytime ? 'dayclear.png' : 'nightclear.png',
                clouds: isDaytime ? 'daycloudy.png' : 'nightcloudy.png',
                rain: isDaytime ? 'dayrainy.png' : 'nightrainy.png', // Corrected from dayrain.png
                thunderstorm: isDaytime ? 'daythnderstorm.png' : 'nightthnderstorm.png',
                snow: isDaytime ? 'daysnowy.png' : 'nightsnowy.png',
                haze: isDaytime ? 'dayhaze.png' : 'nighthaze.png',
                mist: isDaytime ? 'daymist.png' : 'nightmist.png'
                // Add other conditions if needed, e.g., partly_cloudy
            };
            iconElement.src = `images/${weatherIcons[weatherCondition] || (isDaytime ? 'dayclear.png' : 'nightclear.png')}`; // Default to clear if not found
            iconElement.alt = data.weather[0].description;
        } else {
            console.error(`Element with class ${cityDivClass} not found.`);
        }
    }

    // New function to fetch weather for nearby cities
    async function getNearbyCitiesWeather(lat, lon) {
        const apiKey = 'a2e9c4e128c0d0a65b3c008f12186ec7';
        const offsets = [
            { latOffset: 0.5, lonOffset: 0 },    // North
            { latOffset: -0.5, lonOffset: 0 },   // South
            { latOffset: 0, lonOffset: 0.5 },    // East
            { latOffset: 0, lonOffset: -0.5 }    // West
        ];

        const cityDivClasses = ['City1', 'City2', 'City3', 'City4'];

        for (let i = 0; i < offsets.length; i++) {
            const nearbyLat = lat + offsets[i].latOffset;
            const nearbyLon = lon + offsets[i].lonOffset;

            try {
                const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${nearbyLat}&lon=${nearbyLon}&appid=${apiKey}&units=metric`);
                const data = await response.json();
                if (data.cod === 200) { // Check if API call was successful
                    updateNearbyCityUI(data, cityDivClasses[i]);
                } else {
                    console.error(`Error fetching weather for nearby location (${cityDivClasses[i]}):`, data.message);
                    // Optionally clear the div or show an error message
                    const cityElement = document.querySelector(`.${cityDivClasses[i]}`);
                    if (cityElement) {
                        cityElement.querySelector('h1').textContent = `--°`;
                        cityElement.querySelector('p').textContent = `N/A`;
                        cityElement.querySelector('h2').textContent = `Error`;
                        cityElement.querySelector('.Icon img').src = 'images/default.png'; 
                    }
                }
            } catch (error) {
                console.error(`Error fetching weather for nearby location (${cityDivClasses[i]}):`, error);
                const cityElement = document.querySelector(`.${cityDivClasses[i]}`);
                if (cityElement) {
                    cityElement.querySelector('h1').textContent = `--°`;
                    cityElement.querySelector('p').textContent = `N/A`;
                    cityElement.querySelector('h2').textContent = `Error`;
                    cityElement.querySelector('.Icon img').src = 'images/default.png'; 
                }
            }
        }
    }

    function updateHumidity(humidity) {
        const humidityElement = document.querySelector('.Humidity h2');
        const statusElement = document.querySelector('.Humidity h4');

        humidityElement.textContent = `${humidity}%`;

        if (humidity < 30) {
            statusElement.textContent = "Low";
        } else if (humidity < 60) {
            statusElement.textContent = "Comfort";
        } else {
            statusElement.textContent = "High";
        }
    }

    async function getTodayForecast(city) {
        const apiKey = 'a2e9c4e128c0d0a65b3c008f12186ec7';
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            const today = new Date();
            const todayDateString = today.toISOString().split('T')[0];

            let maxTemp = -Infinity;
            let minTemp = Infinity;

            data.list.forEach(item => {
                if (item.dt_txt.startsWith(todayDateString)) {
                    maxTemp = Math.max(maxTemp, item.main.temp_max);
                    minTemp = Math.min(minTemp, item.main.temp_min);
                }
            });

            document.querySelector('.Highandlow p').textContent = `High: ${Math.round(maxTemp)}°C Low: ${Math.round(minTemp)}°C`;
        } catch (error) {
            console.error('Error fetching forecast data:', error);
        }
    }

    async function getTomorrowForecast(city) {
        const apiKey = 'a2e9c4e128c0d0a65b3c008f12186ec7';
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            const tomorrowDateString = tomorrow.toISOString().split('T')[0];

            const tomorrowForecast = data.list.find(item => item.dt_txt.startsWith(tomorrowDateString));

            if (tomorrowForecast) {
                const temp = Math.round(tomorrowForecast.main.temp);
                const weatherDescription = tomorrowForecast.weather[0].description;
                const weatherCondition = tomorrowForecast.weather[0].main.toLowerCase();

                const forecastDiv = document.querySelector(".Nextday");
                const cloudIconDiv = document.querySelector(".CloudIcon img");

                const weatherIcons = {
                    clear: 'dayclear.png',
                    clouds: 'daycloudy.png',
                    rain: 'dayrainy.png',
                    snow: 'daysnowy.png',
                    thunderstorm: 'daythunderstorm.png'
                };

                const iconSrc = `images/${weatherIcons[weatherCondition] || 'default.png'}`;

                forecastDiv.innerHTML = `
                    <p>Tomorrow</p>
                    <samp>${weatherDescription}</samp>
                    <h2>${temp}°</h2>
                `;

                cloudIconDiv.src = iconSrc;
                cloudIconDiv.alt = weatherDescription;
            } else {
                console.error('No forecast data available for tomorrow');
            }
        } catch (error) {
            console.error('Error fetching forecast data:', error);
        }
    }

    async function updateSunInfo(city) {
        const apiKey = 'a2e9c4e128c0d0a65b3c008f12186ec7';
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            const sunrise = new Date(data.sys.sunrise * 1000);
            const sunset = new Date(data.sys.sunset * 1000);

            const sunriseTime = formatTime(sunrise);
            const sunsetTime = formatTime(sunset);
    
            const lengthOfDayMinutes = Math.round((sunset - sunrise) / 60000);
            const hours = Math.floor(lengthOfDayMinutes / 60);
            const minutes = lengthOfDayMinutes % 60;
    
            document.querySelector('.Sunrise h2').innerHTML = `${sunriseTime}`;
            document.querySelector('.Sunset h2').innerHTML = `${sunsetTime}`;
            document.querySelector('.LengthOfDay h2').textContent = `${hours}h ${minutes}m`;
        } catch (error) {
            console.error('Error fetching sun information:', error);
        }
    }
    
    function formatTime(date) {
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const suffix = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        return `${formattedHours}:${formattedMinutes}<span class="time-suffix">${suffix}</span>`;
    }
    
    async function getUVIndex(city) {
        const apiKey = 'a2e9c4e128c0d0a65b3c008f12186ec7'; // Replace with your OpenWeatherMap API key
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
        
        try {
            // Get the city's weather data
            const weatherResponse = await fetch(weatherUrl);
            const weatherData = await weatherResponse.json();
            const { coord } = weatherData;
        
            // Get the UV index data
            const uvUrl = `https://api.openweathermap.org/data/2.5/uvi?lat=${coord.lat}&lon=${coord.lon}&appid=${apiKey}`;
            const uvResponse = await fetch(uvUrl);
            const uvData = await uvResponse.json();
            return uvData.value;
        } catch (error) {
            console.error('Error fetching UV index:', error);
            return null;
        }
    }
      
    function updateGauge(uvIndex) {
        const needle = document.querySelector('.needle');
        const label = document.querySelector('.gauge-center .label');
        const number = document.querySelector('.gauge-center .number');

        const roundedUVIndex = Math.round(uvIndex);
        
        let riskClass;
        let riskLevel;
        let rotation;
      
        if (uvIndex <= 2) {
            riskClass = 'rischio1';
            riskLevel = 'LOW';
            rotation = 16;
        } else if (uvIndex <= 5) {
            riskClass = 'rischio2';
            riskLevel = 'MODERATE';
            rotation = 65;
        } else if (uvIndex <= 7) {
            riskClass = 'rischio3';
            riskLevel = 'HIGH';
            rotation = 115;
        } else {
            riskClass = 'rischio4';
            riskLevel = 'VERY HIGH';
            rotation = 164;
        }
      
        // Update the needle animation
        needle.style.animation = `rotateNeedle 2s forwards`;
        needle.style.transform = `rotate(${rotation}deg)`;
        label.textContent = roundedUVIndex;
        number.textContent = riskLevel;
      
        // Update the gauge class
        document.querySelector('.gauge').className = `gauge four ${riskClass}`;
    }
      
    async function searchCityUVIndex(city) {
        const uvIndex = await getUVIndex(city);
        if (uvIndex !== null) {
            updateGauge(uvIndex);
        } else {
            alert('Unable to fetch UV index. Please try again.');
        }
    }


    // wind speed meter

    function updateWindSpeed(speed) {
        const windSpeedElement = document.getElementById("windSpeedValue");
        const windTimeElement = document.getElementById("windTime");
        const needle = document.getElementById("needle");

        windSpeedElement.textContent = `${speed.toFixed(2)} km/h`;

        const now = new Date();
        const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        windTimeElement.textContent = timeString;

        // Calculate rotation based on wind speed
        const maxSpeed = 100; // You can set this to the maximum wind speed you expect
        const rotation = (speed / maxSpeed) * 180; // Assuming the needle moves from 0 to 180 degrees

        // Apply rotation with animation
        needle.style.transition = 'transform 1s ease-out';
        needle.style.transform = `rotate(${rotation}deg)`;
    }
    
    // AQI
    async function getAQI(city) {
        const apiKey = 'a2e9c4e128c0d0a65b3c008f12186ec7'; // Replace with your actual API key
        try {
            // Fetch city coordinates
            const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`);
            const weatherData = await weatherResponse.json();
            const { coord } = weatherData;

            // Fetch AQI data
            const aqiResponse = await fetch(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${coord.lat}&lon=${coord.lon}&appid=${apiKey}`);
            const aqiData = await aqiResponse.json();
            const aqiValue = aqiData.list[0].main.aqi;
            updateAQI(aqiValue);
        } catch (error) {
            console.error('Error fetching AQI data:', error);
        }
    }

    function updateAQI(aqi) {
        const aqiElement = document.querySelector('.AQI h1');
        const statusElement = document.querySelector('.AQI h2');

        aqiElement.textContent = aqi;

        let status;
        if (aqi == 1) {
            status = "Good";
        } else if (aqi == 2) {
            status = "Fair";
        } else if (aqi == 3) {
            status = "Moderate";
        } else if (aqi == 4) {
            status = "Poor";
        } else if (aqi == 5) {
            status = "Very Poor";
        }

        statusElement.textContent = status;
    }

    function showSection(targetId) {
        document.querySelectorAll(".section").forEach(function(section) {
          if (section.id === targetId) {
            section.classList.add("section-visible");
          } else {
            section.classList.remove("section-visible");
          }
        });
    }
  
    document.querySelectorAll(".icon-link").forEach(function(icon) {
        icon.addEventListener("click", function(event) {
          event.preventDefault(); // Prevent default anchor behavior
          var target = icon.getAttribute("data-target");
  
          if (target === "map") {
            document.getElementById("mapbc").classList.add("mapbc-visible");
            setTimeout(function() { // Wait a bit before invalidating the size
              window.myMap.invalidateSize(); // Refresh the map size
            }, 100);
          } else {
            document.getElementById("mapbc").classList.remove("mapbc-visible");
          }
        });
    });
  
    function initializeMap(city) {
        var mapContainer = document.getElementById('map');
        var map = L.map(mapContainer).setView([20.5937, 78.9629], 5); // Initial center on India
  
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
  
        // Set maximum bounds to prevent map from repeating
        var southWest = L.latLng(-90, -180);
        var northEast = L.latLng(90, 180);
        var bounds = L.latLngBounds(southWest, northEast);
        map.setMaxBounds(bounds);
        map.on('drag', function() {
          map.panInsideBounds(bounds, { animate: false });
        });
  
        var marker; // Declare a marker variable
  
        // Store the map and marker in global variables to update them later
        window.myMap = map;
        window.myMarker = marker;
  
        // Update the map for the default city
        updateMap(city);
    }
  
      async function updateMap(city) {
        const apiKey = 'a2e9c4e128c0d0a65b3c008f12186ec7';
        try {
          const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
          const data = await response.json();
          const { lat, lon } = data.coord;
          const temperature = Math.round(data.main.temp); // Get the temperature
  
          // Update the map view to the searched city
          window.myMap.setView([lat, lon], 10);
  
          // If a marker already exists, remove it
          if (window.myMarker) {
            window.myMap.removeLayer(window.myMarker);
          }
  
          // Add a new marker for the searched city with the temperature and icon in the popup
          window.myMarker = L.marker([lat, lon]).addTo(window.myMap)
            .bindPopup(`
              <div class="popup-content">
                <span>${temperature}°C</span><br>
                <b>${data.name}</b>
              </div>
            `).openPopup();
        } catch (error) {
          console.error('Error updating map:', error);
        }
    }

    document.querySelectorAll(".icon-link").forEach(function(icon) {
        icon.addEventListener("click", function(event) {
            event.preventDefault(); // Prevent default anchor behavior
            var target = icon.getAttribute("data-target");
            var calendar = document.querySelector(".calendar");
    
            if (target === "calendar") {
                // If the calendar is already visible, do nothing
                if (!calendar.classList.contains("calendar-visible")) {
                    calendar.style.visibility = "visible";
                    setTimeout(function() {
                        calendar.classList.add("calendar-visible");
                    }, 10); // Small delay to ensure visibility is set before height animation starts
                }
            } else {
                // Hide the calendar if a different icon is clicked
                if (calendar.classList.contains("calendar-visible")) {
                    calendar.classList.remove("calendar-visible");
                    setTimeout(function() {
                        calendar.style.visibility = "hidden";
                    }, 500); // Wait for the animation to finish before setting visibility to hidden
                }
            }
        });
    });


const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
	container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
	container.classList.remove("right-panel-active");
});

document.addEventListener('DOMContentLoaded', function() {
    const loginButton = document.getElementById('loginButton');
    const signInSignUp = document.querySelector('.signINsignUP');
  
    loginButton.addEventListener('click', function() {
      signInSignUp.classList.toggle('expanded');
    });
  });