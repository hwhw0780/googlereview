let restaurantFinder;

function initMap() {
    console.log('Maps API initialized');
    restaurantFinder = new RestaurantFinder();
}

class RestaurantFinder {
    constructor() {
        this.placesService = new google.maps.places.PlacesService(document.createElement('div'));
        this.searchBtn = document.querySelector('.search-btn');
        this.restaurantGrid = document.querySelector('.restaurant-grid');
        this.loadingElement = document.getElementById('loading');
        this.errorElement = document.getElementById('error');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.searchBtn.addEventListener('click', () => {
            console.log('Search button clicked'); // Debug log
            this.performSearch();
        });
    }

    showLoading(show) {
        this.loadingElement.style.display = show ? 'block' : 'none';
    }

    showError(message) {
        this.errorElement.textContent = message;
        this.errorElement.style.display = 'block';
    }

    performSearch() {
        const cuisine = document.getElementById('cuisine').value;
        const area = document.getElementById('area').value;

        console.log('Searching for:', cuisine, 'in', area); // Debug log

        if (!cuisine || !area) {
            this.showError('Please select both cuisine type and area');
            return;
        }

        // Clear existing results and errors
        this.restaurantGrid.innerHTML = '';
        this.errorElement.style.display = 'none';
        this.showLoading(true);

        // Construct search query
        const query = `${cuisine} restaurant in ${area} Singapore`;
        console.log('Search query:', query); // Debug log

        const request = {
            query: query,
            type: ['restaurant'],
            locationBias: { 
                center: { lat: 1.3521, lng: 103.8198 },
                radius: 10000
            }
        };

        try {
            this.placesService.textSearch(request, (results, status) => {
                console.log('Search status:', status); // Debug log
                console.log('Results:', results); // Debug log

                this.showLoading(false);

                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    if (results.length === 0) {
                        this.showError('No restaurants found for your search criteria');
                        return;
                    }

                    // Sort by rating and number of reviews
                    const sortedResults = results.sort((a, b) => {
                        const aScore = a.rating * Math.log(a.user_ratings_total || 1);
                        const bScore = b.rating * Math.log(b.user_ratings_total || 1);
                        return bScore - aScore;
                    });

                    // Take top 20 results
                    const top20 = sortedResults.slice(0, 20);
                    
                    // Display results
                    top20.forEach(place => this.getPlaceDetails(place.place_id));
                } else {
                    this.showError('Error searching for restaurants. Please try again.');
                    console.error('Places API Error:', status);
                }
            });
        } catch (error) {
            this.showLoading(false);
            this.showError('An error occurred. Please try again.');
            console.error('Error:', error);
        }
    }

    getPlaceDetails(placeId) {
        const request = {
            placeId: placeId,
            fields: ['name', 'rating', 'formatted_address', 'photos', 'user_ratings_total', 'website']
        };

        this.placesService.getDetails(request, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                this.createRestaurantCard(place);
            } else {
                console.error('Error fetching place details:', status);
            }
        });
    }

    createRestaurantCard(place) {
        const card = document.createElement('div');
        card.className = 'restaurant-card';

        const photoUrl = place.photos && place.photos[0] ? 
            place.photos[0].getUrl({maxWidth: 400, maxHeight: 300}) : 
            'placeholder.jpg';

        card.innerHTML = `
            <img src="${photoUrl}" alt="${place.name}">
            <h3>${place.name}</h3>
            <p class="rating">⭐ ${place.rating || 'N/A'} (${place.user_ratings_total || 0} reviews)</p>
            <p class="address">${place.formatted_address}</p>
            ${place.website ? `<a href="${place.website}" target="_blank" class="website-link">Visit Website</a>` : ''}
        `;

        this.restaurantGrid.appendChild(card);
    }
} 