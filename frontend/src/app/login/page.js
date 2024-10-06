"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";

const LoginPage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    // const URL = process.env.NEXT_PUBLIC_URL || 'http://localhost';
    const URL = 'https://20.191.210.182';

    useEffect(() => {
        if (status === 'authenticated') {
            const searchParams = new URLSearchParams(window.location.search);
            const requestedUrl = searchParams.get('requestedUrl');
            const port = searchParams.get('port') || '3000';
            if (requestedUrl) {
                const decodedUrl = decodeURIComponent(requestedUrl);
                const redirectUrl = `${URL}:${port}${decodedUrl}`;

                console.log(`Redirect : ${redirectUrl}`);
                window.location.href = redirectUrl;
            } else {
                router.push('/dashboard');
            }
        }
    }, [status, router, URL]);

    if (status === 'loading') {
        return <p>Loading...</p>;
    }

    const handleSignIn = async () => {
        const searchParams = new URLSearchParams(window.location.search);
        const requestedUrl = searchParams.get('requestedUrl');
        const port = searchParams.get('port') || '3000';
        const callbackUrl = requestedUrl
            ? `${URL}:${port}${decodeURIComponent(requestedUrl)}`
            : '/dashboard';

        const result = await signIn("azure-ad", {
            redirect: false,
            callbackUrl: callbackUrl
        });

        if (result?.error) {
            console.error('Sign in error:', result.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Login</h2>
                <button
                    onClick={handleSignIn}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                    Sign in with EntraID
                </button>
            </div>
        </div>
    );
};

const LoginPageWrapper = () => (
    <Suspense fallback={<p>Loading...</p>}>
        <LoginPage />
    </Suspense>
);

export default LoginPageWrapper;
