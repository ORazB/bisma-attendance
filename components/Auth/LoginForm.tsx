"use client"

import { useState } from "react";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { useSignIn } from '@clerk/nextjs'


import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { signIn, setActive } = useSignIn();

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    // Validation
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    // API call
    let errorMessage = "Registration failed, please try again.";
    try {

      if (!signIn) {
        setErrors({ submit: "Sign-in is not initialized." });
        setIsLoading(false);
        return;
      }

      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });
      console.log("SignIn Attempt:", signInAttempt);

      if (signInAttempt.status === "complete" && signInAttempt.createdSessionId) {
        await setActive({ session: signInAttempt.createdSessionId });
        router.push("/");
      } else if (signInAttempt.status === "needs_second_factor") {

        // show 2FA input to the user
        setErrors({ submit: "Please complete two-factor authentication to sign in." });
      }

    } catch (error) {
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen grid place-items-center py-12 px-4">
      <section className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold">Sign In</h1>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                id="email"
                autoComplete="email"
                placeholder="you@example.com"
                disabled={isLoading}
                required={true}
              />
              {errors.email && <FieldError>{errors.email}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                id="password"
                autoComplete="new-password"
                placeholder="••••••••"
                disabled={isLoading}
                required={true}
              />
              {errors.password && <FieldError>{errors.password}</FieldError>}
            </Field>
          </FieldGroup>

          {errors.submit && (
            <div className="text-sm text-destructive text-center">
              {errors.submit}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Login..." : "Login"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Sign Up
            </Link>
          </p>
        </form>
      </section>
    </div>
  )
}