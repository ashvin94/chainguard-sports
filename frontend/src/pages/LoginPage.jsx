import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const { login, loginWithGoogle, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRegistering, setIsRegistering] = useState(false);
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const redirectPath = location.state?.from?.pathname || "/";

  const handleEmailAuth = async (event) => {
    event.preventDefault();
    setPending(true);
    try {
      if (isRegistering) {
        await register(email, password);
        toast.success("Account created successfully");
      } else {
        await login(email, password);
        toast.success("Welcome back");
      }
      navigate(redirectPath, { replace: true });
    } catch (error) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setPending(false);
    }
  };

  const handleGoogleLogin = async () => {
    setPending(true);
    try {
      await loginWithGoogle();
      toast.success("Signed in with Google");
      navigate(redirectPath, { replace: true });
    } catch (error) {
      toast.error(error.message || "Google sign-in failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center">
      <div className="glass-card w-full max-w-md rounded-2xl p-7 md:p-8">
        <h2 className="text-2xl font-semibold">
          {isRegistering ? "Create account" : "Welcome back"}
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Access your secure digital asset dashboard.
        </p>

        <form onSubmit={handleEmailAuth} className="mt-6 space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-blue-300/25 bg-slate-900/70 px-4 py-2.5 outline-none transition focus:border-blue-400"
            placeholder="Email address"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-blue-300/25 bg-slate-900/70 px-4 py-2.5 outline-none transition focus:border-blue-400"
            placeholder="Password"
          />
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium transition hover:bg-blue-500 disabled:opacity-60"
          >
            {pending ? "Please wait..." : isRegistering ? "Create Account" : "Login"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={pending}
          className="mt-4 w-full rounded-lg border border-blue-300/30 bg-slate-900/65 px-4 py-2.5 font-medium text-blue-100 transition hover:bg-slate-800 disabled:opacity-60"
        >
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => setIsRegistering((prev) => !prev)}
          className="mt-4 text-sm text-blue-300 hover:text-blue-200"
        >
          {isRegistering ? "Have an account? Login" : "No account? Register"}
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
