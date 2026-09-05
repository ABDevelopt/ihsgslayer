"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface MarketPulseEvent {
  type: "INITIAL_HANDSHAKE" | "PULSE" | "PONG" | "SIGNAL_DISPATCHED" | "TRADE_EXECUTED";
  timestamp: string;
  data?: any;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000/ws/market-pulse";

export function useMarketStream() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastPulse, setLastPulse] = useState<MarketPulseEvent | null>(null);
  const [latestSignal, setLatestSignal] = useState<any | null>(null);
  const [latestTrade, setLatestTrade] = useState<any | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const socket = new WebSocket(WS_URL);
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        // Start ping keepalive every 20 seconds
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send("ping");
          }
        }, 20000);
      };

      socket.onmessage = (event) => {
        try {
          const payload: MarketPulseEvent = JSON.parse(event.data);
          setLastPulse(payload);

          if (payload.type === "SIGNAL_DISPATCHED") {
            setLatestSignal(payload.data);
          } else if (payload.type === "TRADE_EXECUTED") {
            setLatestTrade(payload.data);
          }
        } catch {
          // Non-JSON frame (e.g. plain text pong)
        }
      };

      socket.onerror = () => {
        // Handled in onclose
      };

      socket.onclose = () => {
        setIsConnected(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        // Schedule auto-reconnect with 3 second delay
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
    } catch {
      setIsConnected(false);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    lastPulse,
    latestSignal,
    latestTrade,
    reconnect: connect
  };
}
