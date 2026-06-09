import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { io, Socket } from 'socket.io-client';

export interface IslamicToolsState {
  prayerTimes: Record<string, string>;
  qiblaDirection: number;
  ramadanBoost: boolean;
  darkMode: boolean;
  networkStatus: 'ONLINE' | 'OFFLINE' | 'CONNECTING';
}

export const useIslamicTools = () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const getPrayerTimes = async (lat: number, lng: number) => {
    const response = await fetch(
      `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=2`
    );
    const data = await response.json();
    return data.data.timings;
  };

  const getQiblaDirection = async (lat: number, lng: number) => {
    const response = await fetch(
      `https://api.aladhan.com/v1/qibla?latitude=${lat}&longitude=${lng}`
    );
    const data = await response.json();
    return data.data.direction;
  };

  const connectWebSocket = (userId: string) => {
    const socket: Socket = io(`${process.env.NEXT_PUBLIC_API_URL}/ws`, {
      query: { userId, token: supabase.auth.getSession() }
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('network-status', (data) => {
      console.log('Network update:', data);
    });

    return socket;
  };

  const toggleRamadanBoost = async (enabled: boolean) => {
    await supabase.from('user_preferences').upsert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      ramadan_boost_enabled: enabled
    });
  };

  return { getPrayerTimes, getQiblaDirection, connectWebSocket, toggleRamadanBoost };
};