import LoginForm from "@/components/Auth/LoginForm"

import { auth } from "@clerk/nextjs/server"

export default async function Register() {
  
  const { userId } = await auth();
  console.log(userId);
  
  return (
    <LoginForm />
  )
}