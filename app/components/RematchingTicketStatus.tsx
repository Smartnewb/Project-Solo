"use client";

import { useState, useEffect } from "react";
import { TicketIcon } from "@heroicons/react/24/outline";
import axiosServer from "@/utils/axios";

interface RematchingTicket {
  id: string;
  status: string;
  name: string;
  type: string;
  expiredAt: Date;
  createdAt: string;
}

export default function RematchingTicketStatus() {
  const [ticket, setTicket] = useState<RematchingTicket | null>(null);
  const [ticketCount, setTicketCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("로그인이 필요합니다.");
          return;
        }

        const response = await axiosServer.get<RematchingTicket[]>(
          "/tickets/rematching",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setTicket(response.data[0]);
        setTicketCount(response.data.length);
        setError(null);
      } catch (err) {
        setError("재매칭 티켓 정보를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 transform transition-all hover:scale-[1.02] shadow-md">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-[#6C5CE7]/10 flex items-center justify-center transform transition-all duration-200 hover:rotate-12">
          <TicketIcon className="w-7 h-7 text-[#6C5CE7]" />
        </div>
        <h2 className="text-2xl font-bold text-[#2D3436] tracking-tight mb-2">
          재매칭 티켓 개수
        </h2>
      </div>
      <div className="pl-16">
        <p className="text-base text-gray-500 mb-1">
          현재 보유한 재매칭 티켓 개수
        </p>
        {ticketCount !== null ? (
          <p className="text-base text-gray-500">보유 티켓: {ticketCount}개</p>
        ) : (
          <p className="text-base text-gray-500">보유 티켓: 0개</p>
        )}
      </div>
    </div>
  );
}
