import React, { useState, useEffect, useContext } from 'react';
import { Plane, Building2 } from 'lucide-react';
import FlightSearch from './FlightSearch';
import HotelSearch from './HotelSearch';
import FlightCard from './FlightCard';
import HotelCard from './HotelCard';
import Header from '../../components/Header';
import Features from '../../components/Features';
import Statistics from '../../components/Statistics';
import Destination from '../../components/Destination';
import Footer from '../../components/Footer';
import Hero from '../../components/Hero';
import NoResults from '../../components/NoResults';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthProvider';

const TravelBooking = () => {
  const [activeTab, setActiveTab] = useState('flights');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login,user } = useContext(AuthContext);

  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    date: '',
    location: '',
    checkIn: '',
    checkOut: ''
  });
  // const FLIGHT_API_KEY = import.meta.env.VITE_FLIGHT_API_KEY
  // const FLIGHT_API_SECRET = import.meta.env.VITE_FLIGHT_API_SECRET
  // const HOTEL_API_KEY = import.meta.env.VITE_HOTEL_API_KEY

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchResults([]);
    setSearchParams({
      from: '',
      to: '',
      date: '',
      location: '',
      checkIn: '',
      checkOut: ''
    });
  };

  const fetchFlights = async (params) => {
    if(!user){
      toast.error("Login to search")
    }
    console.log("Searching...")
    setLoading(true);
    window.scrollTo(0, 300);
    try {
      const tokenResponse = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: "RzO1u2Jpdo6YvkQSkKYcR5bdNulPtflF",
          client_secret: "tV0H2dDKAkQAf1MP"
        }),
      });

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      const url = new URL("https://test.api.amadeus.com/v2/shopping/flight-offers");
      url.searchParams.append("originLocationCode", params.from);
      url.searchParams.append("destinationLocationCode", params.to);
      url.searchParams.append("departureDate", params.date);
      url.searchParams.append("adults", "1");
      url.searchParams.append("max", "10"); // Limit to 10 results
      url.searchParams.append("currencyCode", "EUR"); // Set currency

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await response.json();

      if (data.data) {
        setSearchResults(data.data);
      } else {
        throw new Error('No flights found');
      }
    } catch (error) {
      console.error("Error fetching flight offers:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHotels = async (params) => {
    if(!user){
      toast.error("Login to search")
    }
    setLoading(true);
    setError('');
    console.log("HOTELS SEARCHING...");
  
    try {
      // First, get the location ID using the mapping endpoint
      const mappingUrl = 'https://api.makcorps.com/mapping';
      const mappingParams = {
        name: params.location,
        api_key: "67a05a9fa27d94525a384c80"
      };
  
      const mappingResponse = await fetch(`${mappingUrl}?${new URLSearchParams(mappingParams)}`);
      
      if (!mappingResponse.ok) {
        throw new Error('Failed to find location');
      }
  
      const mappingData = await mappingResponse.json();
      
      if (!mappingData || mappingData.length === 0) {
        throw new Error('Location not found');
      }
  
      // Find the first city entry (filter out hotels if needed)
      const locationInfo = mappingData.find(item => 
        item.details.placetype === 10004 || // For cities
        item.type === "CITY"
      );
  
      if (!locationInfo) {
        throw new Error('City not found');
      }
  
      const locationId = locationInfo.document_id;
  
      // Now proceed with hotel search using the found location ID
      const url = 'https://api.makcorps.com/city';
      const checkInDate = new Date(params.checkIn);
      const checkOutDate = new Date(params.checkOut);
      const diffTime = Math.abs(checkOutDate - checkInDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
      if (diffDays > 28) {
        throw new Error('Booking duration cannot exceed 28 days');
      }
  
      if (diffDays < 1) {
        throw new Error('Check-out date must be after check-in date');
      }
  
      const queryParams = {
        cityid: locationId,
        pagination: '0',
        cur: 'USD',
        rooms: '1',
        adults: '2',
        checkin: params.checkIn,
        checkout: params.checkOut,
        api_key: "67a05a9fa27d94525a384c80"
      };
  
      const response = await fetch(`${url}?${new URLSearchParams(queryParams)}`);
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch hotels');
      }
  
      const data = await response.json();
  
      if (!data || data.length === 0) {
        throw new Error('No hotels found for the selected dates');
      }
  
      const validHotels = data.filter(hotel =>
        hotel.name &&
        hotel.price1 &&
        hotel.reviews?.rating &&
        hotel.geocode?.latitude &&
        hotel.geocode?.longitude
      );
  
      if (validHotels.length === 0) {
        throw new Error('No valid hotel data found');
      }
  
      setSearchResults(validHotels);
      setError('');
  
    } catch (error) {
      console.error("Error:", error.message);
      setSearchResults([]);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (params) => {
    setSearchParams(params);
    if (activeTab === 'flights') {
      if (params.from && params.to && params.date) {
        fetchFlights(params);
      }
    } else {
      if (params.location && params.checkIn && params.checkOut) {
        fetchHotels(params);
      }
    }
  };


  

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* <button onClick={fetchFlights}> Fetch Flights</button> */}

      <main className="max-w-7xl mt-16 mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Hero />

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex space-x-4 mb-6 justify-center md:justify-start">
            <button
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'flights'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              onClick={() => handleTabChange('flights')}
            >
              <Plane className="h-5 w-5" />
              <span>Flights</span>
            </button>
            <button
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'hotels'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              onClick={() => handleTabChange('hotels')}
            >
              <Building2 className="h-5 w-5" />
              <span>Hotels</span>
            </button>
          </div>

          {activeTab === 'flights' ? (
            <FlightSearch
              isLoading={loading}
              onSearch={handleSearch}
              initialValues={{
                from: searchParams.from,
                to: searchParams.to,
                date: searchParams.date
              }}
            />
          ) : (
            <HotelSearch
              onSearch={handleSearch}
              initialValues={{
                location: searchParams.location,
                checkIn: searchParams.checkIn,
                checkOut: searchParams.checkOut
              }}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : error ? (
            <div className="col-span-full">
              <NoResults
                type={activeTab}
                error={error}
                onReset={() => {
                  setSearchParams({
                    from: '',
                    to: '',
                    date: '',
                    location: '',
                    checkIn: '',
                    checkOut: ''
                  });
                  setError('');
                }}
              />
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((result, index) => (
              activeTab === 'flights' ? (
                <FlightCard key={index} data={result} />
              ) : (
                <HotelCard key={index} data={result} />
              )
            ))
          ) : (
            <NoResults
              type={activeTab}
              onReset={() => {
                setSearchParams({
                  from: '',
                  to: '',
                  date: '',
                  location: '',
                  checkIn: '',
                  checkOut: ''
                });
              }}
            />
          )}
        </div>
      </main>

      <Features />
      <Statistics />
      <Destination />
      
    </div>
  );
};

export default TravelBooking;
