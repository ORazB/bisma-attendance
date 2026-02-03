import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

import MainPage from "@/components/Landing/MainPage";
import AdminPage from "@/components/Admin/AdminPage";
import { redirect } from "next/navigation";

export default async function Home() {

  const { userId } = await auth();

  if (!userId) {
    return redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: {clerkId: userId}
  })

  if (!user) {
    return redirect("/login")
  }

  if (user.role == "USER") {
    return <MainPage userRole={user.role} />;
  } else if (user.role == "ADMIN") {
    return <AdminPage />;
  } else {
    return redirect("/login");
  }
}
