// App.js

import "./App.css";
import Axios from "axios";
import React, { memo, useEffect, useState } from "react";

// Memoized CryptoRow so only changed rows re-render
const CryptoRow = memo(function CryptoRow({ data }) {
    // Only re-render if the data for this row actually changes
    return (
        <tr>
            <td className="rank">{data.market_cap_rank}</td>
            <td className="logo">
                <img src={data.image} alt="logo" width="30px" style={{ background: '#fff', borderRadius: '50%' }} />
                <p>{data.name}</p>
            </td>
            <td className="symbol">{data.symbol}</td>
            <td>${Number(data.market_cap).toLocaleString()}</td>
            <td>${Number(data.current_price).toLocaleString()}</td>
            <td>{data.total_supply ? Number(data.total_supply).toLocaleString() : 'N/A'}</td>
            <td>{data.total_volume ? Number(data.total_volume).toLocaleString() : 'N/A'}</td>
        </tr>
    );
}, (prevProps, nextProps) => {
    // Only re-render if the data for this row actually changes
    return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
});

function App() {
    // Setting up the initial states using
    // react hook 'useState'
    const [search, setSearch] = useState("");
    const [crypto, setCrypto] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper to update only values, not re-render the whole table
    const [cryptoMap, setCryptoMap] = useState({});

    // Store sorted crypto list and ranks in state, update only on data fetch
    const [sortedCrypto, setSortedCrypto] = useState([]);

    // Fetching crypto data from the API only
    // once when the component is mounted
    useEffect(() => {
        let isFirstFetch = true;
        const isGithubPages = window.location.hostname.endsWith('github.io');
        const fetchData = () => {
            if (isFirstFetch) setLoading(true);
            setError(null);
            const apiUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false';
            Axios.get(apiUrl)
                .then((res) => {
                    let coins = [];
                    // CoinGecko returns an array directly
                    if (Array.isArray(res.data)) {
                        coins = res.data.map((item, idx) => ({
                            id: item.id,
                            name: item.name,
                            symbol: item.symbol.toUpperCase(),
                            image: item.image,
                            market_cap: item.market_cap,
                            current_price: item.current_price,
                            total_supply: item.total_supply,
                            total_volume: item.total_volume,
                            market_cap_rank: item.market_cap_rank || (idx + 1),
                        }));
                    }
                    // Sort by market cap and assign rank
                    const sorted = coins.slice().sort((a, b) => Number(b.market_cap) - Number(a.market_cap))
                        .map((coin, idx) => ({ ...coin, market_cap_rank: idx + 1 }));
                    setSortedCrypto(sorted);
                    setCrypto((prev) => {
                        if (JSON.stringify(prev) === JSON.stringify(coins) || !JSON.stringify(prev)) {
                            if (isFirstFetch) setLoading(false);
                            isFirstFetch = false;
                            return prev;
                        }
                        if (isFirstFetch) setLoading(false);
                        isFirstFetch = false;
                        return coins;
                    });
                })
                .catch((err) => {
                    console.log('API error:', err);
                    setError("Failed to fetch data");
                    if (isFirstFetch) setLoading(false);
                    isFirstFetch = false;
                });
        };

        fetchData(); // Initial fetch
        const interval = setInterval(fetchData, 3000); // Fetch every 3 seconds
        return () => clearInterval(interval); // Cleanup on unmount
    }, []);

    useEffect(() => {
        setCryptoMap(
            Array.isArray(crypto)
                ? Object.fromEntries(crypto.map((c) => [c.id, c]))
                : {}
        );
    }, [crypto]);

    return (
        <div className="App">
            <h1>Crypto Search</h1>
            <input
                type="text"
                placeholder="Search..."
                onChange={(e) => {
                    setSearch(e.target.value);
                }}
            />
            {loading && <p>Loading...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            {!loading && !error && Array.isArray(crypto) && crypto.length > 0 && (
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Name</th>
                            <th>Symbol</th>
                            <th>Market Cap</th>
                            <th>Price</th>
                            <th>Available Supply</th>
                            <th>Volume(24hrs)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Only filter for search, do not re-sort or re-rank */}
                        {sortedCrypto
                            .filter((val) => val.name && val.name.toLowerCase().includes(search.toLowerCase()))
                            .map((val) => (
                                <CryptoRow key={val.id} data={val} />
                            ))}
                    </tbody>
                </table>
            )}
            {!loading && !error && Array.isArray(crypto) && crypto.length === 0 && (
                <p>No cryptocurrencies found.</p>
            )}
        </div>
    );
}

export default App;