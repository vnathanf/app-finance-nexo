import { Suspense } from 'react';
import AssetDetailScreen from '@/components/assets/AssetDetailScreen';

export default function Page() {
  return (
    <Suspense>
      <AssetDetailScreen />
    </Suspense>
  );
}
