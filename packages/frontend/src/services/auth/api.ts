import { Amplify } from "aws-amplify";
import {
  confirmSignUp as amplifyConfirmSignUp,
  getCurrentUser as amplifyGetCurrentUser,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  signUp as amplifySignUp,
  fetchAuthSession,
} from "aws-amplify/auth";

const GENERIC_SIGN_IN_ERROR = "Invalid email or password";

function getErrorField(error: unknown, field: "name" | "message"): string | undefined {
  if (typeof error !== "object" || error === null || !(field in error)) {
    return undefined;
  }

  const value = error[field as keyof typeof error];
  return typeof value === "string" ? value : undefined;
}

function isSignInCredentialError(error: unknown): boolean {
  const name = getErrorField(error, "name");
  const message = getErrorField(error, "message")?.toLowerCase() ?? "";

  if (
    name === "UserNotFoundException" ||
    name === "NotAuthorizedException" ||
    name === "UserNotConfirmedException"
  ) {
    return true;
  }

  return (
    message.includes("user does not exist") || message.includes("incorrect username or password")
  );
}

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
    },
  },
});

const PASSWORD_REQUIREMENTS =
  "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";

function isSignUpPasswordError(error: unknown): boolean {
  const name = getErrorField(error, "name");
  const message = getErrorField(error, "message")?.toLowerCase() ?? "";
  return (
    name === "InvalidPasswordException" || message.includes("password did not conform with policy")
  );
}

export function validateSignUpPassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must include a lowercase letter.";
  if (!/[0-9]/.test(password)) return "Password must include a number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must include a special character.";
  return null;
}

export async function signUp(email: string, password: string) {
  try {
    return await amplifySignUp({
      username: email,
      password,
      options: {
        userAttributes: { email },
      },
    });
  } catch (error: unknown) {
    if (isSignUpPasswordError(error)) {
      throw new Error(PASSWORD_REQUIREMENTS);
    }
    throw error;
  }
}

export async function confirmSignUp(email: string, code: string) {
  return amplifyConfirmSignUp({ username: email, confirmationCode: code });
}

export async function signIn(email: string, password: string) {
  try {
    return await amplifySignIn({ username: email, password });
  } catch (error: unknown) {
    if (isSignInCredentialError(error)) {
      throw new Error(GENERIC_SIGN_IN_ERROR);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Sign in failed");
  }
}

export async function signOut() {
  return amplifySignOut();
}

export async function getCurrentUser() {
  return amplifyGetCurrentUser();
}

export async function getIdToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
}
