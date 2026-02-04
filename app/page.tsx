import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import MainPage from "@/components/Landing/MainPage";
import AdminPage from "@/components/Admin/AdminPage";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) return redirect("/login");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId }
  });

  if (!user) return redirect("/login");

  if (user.role === "USER") {
    return <MainPage userRole={user.role} />;
  }

  const userAttendance = await prisma.attendance.findMany();
  const users = await prisma.user.findMany();
  const userImageMap: Record<string, string> = {};

  const clerkIds = users.map(u => u.clerkId);

  const client = await clerkClient();
  const response = await client.users.getUserList({
    userId: clerkIds,
  });

  response.data.forEach(clerkUser => {
    userImageMap[clerkUser.id] = clerkUser.imageUrl;
  });

  return <AdminPage userAttendance={userAttendance} users={users} userImages={userImageMap} />;
}