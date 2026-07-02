import { Suspense } from 'react';
import AssetDetailScreen from '@/features/assets/components/AssetDetailScreen';

export default function Page() {
  return (
    <Suspense>
      <AssetDetailScreen />
    </Suspense>
  );
}
