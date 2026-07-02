import { Suspense } from 'react';
import ProjectDetailScreen from '@/features/projects/components/ProjectDetailScreen';

export default function Page() {
  return (
    <Suspense>
      <ProjectDetailScreen />
    </Suspense>
  );
}
