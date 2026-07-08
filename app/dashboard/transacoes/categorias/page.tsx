import { Suspense } from 'react';
import RulesScreen from "@/features/finance/categories/components/RulesScreen";

export default function Page() {
  return (
    <Suspense>
      <RulesScreen />
    </Suspense>
  );
}
