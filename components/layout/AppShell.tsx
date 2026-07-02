"use client";

import { ReactNode } from "react";

import Header from "./Header";

interface Props {
    children: ReactNode;
}

export default function AppShell({
    children,
}: Props) {

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
