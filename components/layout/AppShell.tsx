"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

import Header from "./Header";
import NexoLoading from "@/components/nexo/NexoLoading";
import { useAuth } from "@/features/auth/contexts/AuthContext";

interface Props {
    children: ReactNode;
}

export default function AppShell({
    children,
}: Props) {
    const router = useRouter();
    const { user, isLoading, status, isApproved } = useAuth();

    useEffect(() => {
        if (isLoading) return;
        if (!user) {
            router.replace("/login");
            return;
        }
        if (status !== null && !isApproved) {
            router.replace("/pendente");
        }
    }, [isLoading, user, status, isApproved, router]);

    if (isLoading || !user || !isApproved) {
        return (
            <div className="min-h-screen bg-background">
                <main className="mx-auto max-w-7xl px-4 py-6">
                    <NexoLoading />
                </main>
            </div>
        );
    }

    return (

        <div className="min-h-screen bg-background">

            <Header />

            <main
                className="
          mx-auto
          max-w-7xl
          px-4
          py-6
        "
            >

                {children}

            </main>

        </div>

    );

}
