// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import FacebookProvider from "next-auth/providers/facebook";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if user exists in lecturers collection
      const client = await clientPromise;
      const db = client.db('attendance_system');
      
      let lecturer = await db.collection('lecturers').findOne({ 
        email: user.email.toLowerCase() 
      });

      // If lecturer doesn't exist, create one
      if (!lecturer) {
        const newLecturer = {
          name: user.name,
          email: user.email.toLowerCase(),
          password: null, // OAuth users don't have passwords
          department: 'Not specified',
          university: 'North West University, Kano',
          createdAt: new Date(),
          lastLogin: new Date(),
          lastLoginMethod: account.provider,
          isActive: true,
          oauthProvider: account.provider,
        };

        await db.collection('lecturers').insertOne(newLecturer);
        console.log('✅ New OAuth lecturer created:', user.email);
      } else {
        // Update last login
        await db.collection('lecturers').updateOne(
          { email: user.email.toLowerCase() },
          { 
            $set: { 
              lastLogin: new Date(),
              lastLoginMethod: account.provider 
            } 
          }
        );
        console.log('✅ OAuth login:', user.email);
      }

      return true;
    },
    async session({ session, user }) {
      // Add custom data to session
      const client = await clientPromise;
      const db = client.db('attendance_system');
      
      const lecturer = await db.collection('lecturers').findOne({ 
        email: session.user.email.toLowerCase() 
      });

      if (lecturer) {
        session.user.id = lecturer._id.toString();
        session.user.department = lecturer.department;
        session.user.university = lecturer.university;
      }

      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };