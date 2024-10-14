"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";

const LoginPage = () => {
    const { data: session, status } = useSession();
    const router = useRouter();
    const URL = process.env.NEXTAUTH_URL || 'http://localhost';

    useEffect(() => {
        document.title = "Login Page";

        if (status === 'authenticated') {
            const searchParams = new URLSearchParams(window.location.search);
            const requestedUrl = searchParams.get('requestedUrl');
            if (requestedUrl) {
                const decodedUrl = decodeURIComponent(requestedUrl);
                const redirectUrl = `${URL}${decodedUrl}`;

                console.log(`Redirecting to: ${redirectUrl}`);

                window.location.href = redirectUrl;
            } else {
                router.push('/analytics');
            }
        }
    }, [status, router, URL]);

    if (status === 'loading') {
        return <p>Loading...</p>;
    }

    const handleSignIn = async () => {
        const searchParams = new URLSearchParams(window.location.search);
        const requestedUrl = searchParams.get('requestedUrl');

        console.log(requestedUrl);
        const callbackUrl = requestedUrl
            ? `${URL}${decodeURIComponent(requestedUrl)}`
            : '/analytics';

        console.log(`Callback URL: ${callbackUrl}`);

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
