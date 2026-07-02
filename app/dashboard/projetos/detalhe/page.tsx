import { Suspense } from 'react';
import ProjectDetailScreen from '@/components/projects/ProjectDetailScreen';

export default function Page() {
  return (
    <Suspense>
      <ProjectDetailScreen />
    </Suspense>
  );
}
