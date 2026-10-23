"use client";
import { Button } from "@heroui/react";
import { useState } from "react";

import { GrowthDashboard } from "./growth/GrowthDashboard";
import { BehaviorDashboard } from "./growth/BehaviorDashboard";

type MainTab = "growth" | "behavior";

const TABS: Array<{ key: MainTab; label: string }> = [
  { key: "growth", label: "매출 성장" },
  { key: "behavior", label: "결제 행동·상품" },
];

function SalesPageContent() {
  const [mainTab, setMainTab] = useState<MainTab>("growth");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">매출</h1>
            <p className="mt-2 text-sm text-gray-600">
              매출 추세와 성장률, 누가 왜 결제하는지, 어떤 상품·기능에 돈이 쓰이는지 확인하세요
            </p>
          </div>
          <div className="mt-6 flex gap-2 overflow-x-auto border-b border-gray-200">
            {TABS.map((tab) => (
              <Button
                key={tab.key}
                onClick={() => setMainTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  mainTab === tab.key
                    ? "border-[#7A4AE2] text-[#7A4AE2]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                variant="secondary"
                size="md"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {mainTab === "growth" ? <GrowthDashboard /> : <BehaviorDashboard />}
      </div>
    </div>
  );
}

export default function SalesV2() {
  return <SalesPageContent />;
}
