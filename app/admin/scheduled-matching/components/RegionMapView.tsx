'use client';
import { Spinner } from '@heroui/react';
import dynamic from 'next/dynamic';
import type { MatchingPoolCountry, MatchingPoolRegionStats } from '@/types/admin';
const RegionMapCore = dynamic(() => import('./RegionMapCore'), {
    ssr: false,
    loading: () => (<div style={{ height: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: "#f3f4f6", borderRadius: 2 }}>
      <Spinner size="sm"></Spinner>
    </div>),
});
export interface RegionMapData {
    country: MatchingPoolCountry;
    regions: MatchingPoolRegionStats[];
}
interface RegionMapViewProps {
    data: RegionMapData;
}
export default function RegionMapView({ data }: RegionMapViewProps) {
    return <RegionMapCore data={data}></RegionMapCore>;
}
