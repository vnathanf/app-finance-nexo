import { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";

interface Props {
    children: ReactNode;
}

export default function DashboardLayout({
    children,
}: Props) {
    return (
        <AppShell>

            {children}

        </AppShell>
    );
}