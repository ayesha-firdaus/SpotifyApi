
import React, { useEffect, useState } from 'react';

function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token') || null);
  const [albums, setAlbums] = useState([]);
  const [query, setQuery] = useState("");
  const [playlist, setPlaylist] = useState([]);
  const [play, setPlay] = useState(null);

  useEffect(() => {
    if (!token) {
      fetchToken();
    }
  }, [token]);

  const fetchToken = async () => {
    const client_id = '616b87b9814d4ce5b2f81ea5e8884053';
    const client_secret = 'a9ccf32fae304582acb54d4d2ceaf1d9';
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const credentials = btoa(`${client_id}:${client_secret}`);

    try {
      const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      const data = await res.json();
      setToken(data.access_token);
      localStorage.setItem('access_token', data.access_token);
    } catch (error) {
      console.error('Error fetching token:', error);
    }
  };

  const refreshAccessToken = async () => {
    const client_id = '616b87b9814d4ce5b2f81ea5e8884053';
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      console.error('No refresh token found.');
      return;
    }

    const tokenUrl = 'https://accounts.spotify.com/api/token';
    try {
      const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: client_id
        }),
      });

      const data = await res.json();
      setToken(data.access_token);
      localStorage.setItem('access_token', data.access_token);

      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      console.log('Access token refreshed successfully.');
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  };

  useEffect(() => {
    if (token) {
      getAlbumData();
    }
  }, [token, query]);

  const getAlbumData = async () => {
    if (!query) {
      console.log("Query is empty. Please enter a search term.");
      return;
    }

    try {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${query}&type=album`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        if (res.status === 401) {
          await fetchToken();
          await getAlbumData();
        } else {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
      } else {
        const data = await res.json();
        setAlbums(data?.albums?.items || []);
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
    }
  };

  const handlePlayTrack = async (albumId) => {
    try {
      const res = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        await refreshAccessToken();
      } else {
        const data = await res.json();
        if (data?.items?.length > 0) {
          setPlay(data.items[0]);
        }
      }
    } catch (e) {
      console.log(e);
    }
  };

  const removefromPlaylist = (index) => {
    setPlaylist((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      {play && (
        <iframe
          className="mb-6 rounded-md shadow-lg"
          src={`https://open.spotify.com/embed/track/${play.id}?utm_source=generator&theme=0`}
          width="100%"
          height="152"
          frameBorder="0"
          allowFullScreen=""
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        ></iframe>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h1 className="text-3xl font-bold text-purple-700 mb-4">Search for an Album</h1>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition"
            placeholder="Enter album name..."
          />
          <div className="mt-6 space-y-4">
            {albums.map((album, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white shadow-md rounded-lg hover:bg-gray-100 transition">
                <div className="flex items-center space-x-4">
                  <img src={album.images[0].url} alt={album.name} className="w-16 h-16 rounded-md" />
                  <p className="text-lg font-medium text-gray-700">{album.name}</p>
                </div>
                <button
                  onClick={() => setPlaylist((prev) => [...prev, album])}
                  className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-500 transition"
                >
                  Add to Playlist
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-purple-700 mb-4">Your Playlist</h1>
          {playlist.length === 0 ? (
            <p className="text-gray-500">No items in your playlist</p>
          ) : (
            <div className="space-y-4">
              {playlist.map((album, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white shadow-md rounded-lg hover:bg-gray-100 transition cursor-pointer"
                  onClick={() => handlePlayTrack(album.id)}
                >
                  <div className="flex items-center space-x-4">
                    <img src={album.images[0].url} alt={album.name} className="w-16 h-16 rounded-md" />
                    <p className="text-lg font-medium text-gray-700">{album.name}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removefromPlaylist(index);
                    }}
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-400 transition"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
