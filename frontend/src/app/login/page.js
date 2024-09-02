"use client";


import { signIn } from "next-auth/react";


const LoginPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Login</h2>
                <button
                    onClick={() => signIn("azure-ad")}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                    Sign in with EntraID
                </button>
            </div>
        </div>
    );
};

export default LoginPage;

