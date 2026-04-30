const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";

export function getGoogleAuthStartUrl() {
  if (!apiUrl || apiUrl.startsWith("mock://")) {
    return "";
  }

  return `${apiUrl.replace(/\/+$/, "")}/auth/google/start`;
}

export function getGoogleAuthErrorMessage(errorCode: string) {
  switch (errorCode) {
    case "google_oauth_state_invalid":
      return "Google sign-in session expired. Please try again.";
    case "google_oauth_profile_invalid":
      return "Google did not return a verified email for this account.";
    case "google_oauth_start_failed":
      return "Google sign-in could not be started right now.";
    case "google_oauth_failed":
      return "Google sign-in failed. Please try again.";
    default:
      return "";
  }
}
