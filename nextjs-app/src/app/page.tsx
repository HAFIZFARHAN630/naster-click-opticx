"use client";

import { NextPage } from 'next';
import { useState } from 'react';

const HomePage: NextPage = () => {
  const [prayerTimes, setPrayerTimes] = useState({
    Fajr: '05:00',
    Sunrise: '06:30',
    Dhuhr: '12:00',
    Asr: '15:30',
    Maghrib: '18:45',
    Isha: '19:30'
  });

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>ISP Subscriber Portal</h1>
      
      <section style={{ marginBottom: '20px' }}>
        <h2>Prayer Times</h2>
        {Object.entries(prayerTimes).map(([name, time]) => (
          <div key={name} style={{ display: 'flex', justifyContent: 'space-between', width: '200px' }}>
            <span>{name}</span>
            <span>{time}</span>
          </div>
        ))}
      </section>

      <section style={{ marginBottom: '20px' }}>
        <h2>Available Packages</h2>
        <button style={{ margin: '5px', padding: '10px 20px' }}>Basic - PKR 1500</button>
        <button style={{ margin: '5px', padding: '10px 20px' }}>Premium - PKR 3000</button>
        <button style={{ margin: '5px', padding: '10px 20px' }}>Gaming - PKR 5000</button>
      </section>

      <section>
        <h2>Network Status</h2>
        <p>Status: Online</p>
        <p>Speed: 100 Mbps</p>
      </section>
    </div>
  );
};

export default HomePage;