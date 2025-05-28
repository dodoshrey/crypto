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

    const [showAllColumns, setShowAllColumns] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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
        const interval = setInterval(fetchData, 30000); // Fetch every 30 seconds
        return () => clearInterval(interval); // Cleanup on unmount
    }, []);

    useEffect(() => {
        setCryptoMap(
            Array.isArray(crypto)
                ? Object.fromEntries(crypto.map((c) => [c.id, c]))
                : {}
        );
    }, [crypto]);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Determine which columns to show
    const showPrice = true;
    const showMarketCap = windowWidth >= 600;
    const showSupply = windowWidth > 800 || showAllColumns;
    const showVolume = windowWidth > 800 || showAllColumns;
    const isMobile = windowWidth < 600;

    return (
        <div
            className="App"
            style={{
                maxWidth: 900,
                margin: '0 auto',
                padding: '1em',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
            }}
        >
            <h1 style={{ textAlign: 'center', marginBottom: '1em', fontSize: isMobile ? '2em' : '2.5em' }}>Crypto Search</h1>
            <input
                type="text"
                placeholder="Search..."
                style={{
                    width: isMobile ? '100%' : 300,
                    padding: '0.7em 1em',
                    marginBottom: '1.5em',
                    borderRadius: 8,
                    border: '1px solid #ccc',
                    fontSize: '1em',
                    boxSizing: 'border-box',
                    textAlign: 'center'
                }}
                onChange={(e) => {
                    setSearch(e.target.value);
                }}
            />
            {loading && <p>Loading...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            {!loading && !error && Array.isArray(crypto) && crypto.length > 0 && (
                <>
                    <div
                        className="crypto-flex-table"
                        style={{
                            width: '100%',
                            background: '#fff',
                            borderRadius: 12,
                            boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                            overflow: 'hidden',
                            margin: '0 auto'
                        }}
                    >
                        <div
                            className="crypto-flex-header"
                            style={{
                                color: '#333',
                                display: 'flex',
                                flexDirection: 'row',
                                fontWeight: 600,
                                background: '#f5f6fa',
                                padding: isMobile ? '0.7em 0.5em' : '1em 1.5em',
                                fontSize: isMobile ? '0.95em' : '1.1em',
                                borderBottom: '2px solid #bdbdbd',
                                justifyContent: 'center',
                                textAlign: 'center'
                            }}
                        >
                            <span style={{ flex: '0 0 50px', minWidth: 40, textAlign: 'center', borderRight: '1px solid rgb(0, 0, 0)' }}>Rank</span>
                            <span style={{ flex: '1 1 120px', minWidth: 90, textAlign: 'center', borderRight: '1px solid rgb(0, 0, 0)' }}>Name</span>
                            <span style={{ flex: '0 0 70px', minWidth: 60, textAlign: 'center', borderRight: '1px solid rgb(0, 0, 0)' }}>Symbol</span>
                            {showPrice && (
                                <span style={{ flex: '1 1 100px', minWidth: 80, textAlign: 'center', borderRight: showMarketCap ? '1px solid rgb(0, 0, 0)' : 'none' }}>Price</span>
                            )}
                            {showMarketCap && (
                                <span style={{ flex: '1 1 120px', minWidth: 90, textAlign: 'center', borderRight: showVolume ? '1px solid rgb(0, 0, 0)' : 'none' }}>Market Cap</span>
                            )}
                            {showSupply && (
                                <span style={{ flex: '1 1 120px', minWidth: 90, textAlign: 'center', borderRight: showVolume ? '1px solid rgb(0, 0, 0)' : 'none' }}>Available Supply</span>
                            )}
                            {showVolume && (
                                <span style={{ flex: '1 1 120px', minWidth: 90, textAlign: 'center' }}>Volume(24hrs)</span>
                            )}
                        </div>
                        {/* Divider between header and rows */}
                        <div style={{ width: '100%', height: 0, borderBottom: '2px solid #bdbdbd' }} />
                        {sortedCrypto
                            .filter((val) => val.name && val.name.toLowerCase().includes(search.toLowerCase()))
                            .map((val) => (
                                <div
                                    className="crypto-flex-row"
                                    key={val.id}
                                    style={{
                                        color: '#333',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: isMobile ? '0.7em 0.5em' : '1em 1.5em',
                                        borderBottom: '1px solid #f0f0f0',
                                        fontSize: isMobile ? '0.97em' : '1.05em',
                                        background: 'inherit',
                                        overflowX: 'auto',
                                        textAlign: 'center'
                                    }}
                                >
                                    <span className="crypto-flex-cell rank" style={{ flex: '0 0 50px', minWidth: 40, fontWeight: 500, textAlign: 'center', borderRight: '1px solid rgb(0, 0, 0)' }}>{val.market_cap_rank}</span>
                                    <span className="crypto-flex-cell logo" style={{ flex: '1 1 120px', minWidth: 90, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', textAlign: 'center', borderRight: '1px solid rgb(0, 0, 0)' }}>
                                        <img src={val.image} alt="logo" width="28px" height="28px" style={{ background: '#fff', borderRadius: '50%', border: '1px solid #eee', marginRight: 8 }} />
                                        <span style={{ fontWeight: 500 }}>{val.name}</span>
                                    </span>
                                    <span className="crypto-flex-cell symbol" style={{ flex: '0 0 70px', minWidth: 60, textTransform: 'uppercase', color: '#888', textAlign: 'center', borderRight: '1px solid rgb(0, 0, 0)' }}>{val.symbol}</span>
                                    {showPrice && (
                                        <span className="crypto-flex-cell" style={{ flex: '1 1 100px', minWidth: 80, textAlign: 'center', borderRight: showMarketCap ? '1px solid rgb(0, 0, 0)' : 'none' }}>${Number(val.current_price).toLocaleString()}</span>
                                    )}
                                    {showMarketCap && (
                                        <span className="crypto-flex-cell" style={{ flex: '1 1 120px', minWidth: 90, textAlign: 'center', borderRight: showVolume ? '1px solid rgb(0, 0, 0)' : 'none' }}>${Number(val.market_cap).toLocaleString()}</span>
                                    )}
                                    {showSupply && (
                                        <span className="crypto-flex-cell" style={{ flex: '1 1 120px', minWidth: 90, textAlign: 'center', borderRight: showVolume ? '1px solid rgb(0, 0, 0)' : 'none' }}>{val.total_supply ? Number(val.total_supply).toLocaleString() : 'N/A'}</span>
                                    )}
                                    {showVolume && (
                                        <span className="crypto-flex-cell" style={{ flex: '1 1 120px', minWidth: 90, textAlign: 'center' }}>{val.total_volume ? Number(val.total_volume).toLocaleString() : 'N/A'}</span>
                                    )}
                                </div>
                            ))}
                    </div>
                    {(windowWidth <= 800 && windowWidth >= 600) && (
                        <button
                            onClick={() => setShowAllColumns((v) => !v)}
                            style={{
                                margin: '1.2em auto',
                                display: 'block',
                                padding: '0.7em 1.5em',
                                borderRadius: 8,
                                border: 'none',
                                background: '#007bff',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '1em',
                                cursor: 'pointer',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                            }}
                        >
                            {showAllColumns ? 'Show Less' : 'Show More'}
                        </button>
                    )}
                    {isMobile && (
                        <button
                            onClick={() => setShowAllColumns((v) => !v)}
                            style={{
                                margin: '1.2em auto',
                                display: 'block',
                                padding: '0.7em 1.5em',
                                borderRadius: 8,
                                border: 'none',
                                background: '#007bff',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '1em',
                                cursor: 'pointer',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                            }}
                        >
                            {showAllColumns ? 'Show Less' : 'Show More'}
                        </button>
                    )}
                </>
            )}
            {!loading && !error && Array.isArray(crypto) && crypto.length === 0 && (
                <p>No cryptocurrencies found.</p>
            )}
        </div>
    );
}

export default App;