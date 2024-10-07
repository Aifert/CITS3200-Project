import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ONE_DAY_IN_SECONDS = 24 * 60 * 60; // The amount of seconds in a day

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export default NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: ONE_DAY_IN_SECONDS,
    updateAge: ONE_DAY_IN_SECONDS /2,
  },
  jwt: {
    maxAge: ONE_DAY_IN_SECONDS,
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      const parsedUrl = new URL(url, baseUrl);

      if (parsedUrl) {
        return parsedUrl;
      }
      return baseUrl + "/analytics";
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
});
