import { useState, useEffect } from "react";
import { supabase } from "../supabase/supabase"; // Assuming you have this file
import { toast } from "react-toastify";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // --- NEW: State for department logic ---
  const [departmentId, setDepartmentId] = useState(''); // Stores the selected department's ID
  const [departments, setDepartments] = useState([]); // Stores the list of all departments

  // --- NEW: Fetch departments from the database when the component loads ---
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase.from('departments').select('id, name');
      if (error) {
        console.error("Error fetching departments:", error);
      } else {
        setDepartments(data);
      }
    };
    fetchDepartments();
  }, []);

  // Handle Login (No changes needed for this function)
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      toast.success(`Login successful!`);
      // The main App component will handle fetching user profile data after this
    
    } catch (err) {
      console.error("Login error:", err);
      toast.error("An unexpected error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  // --- UPDATED: Handle Register function for the new schema ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Sign up the user in the 'auth' schema.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        toast.error(authError.message);
        return;
      }

      if (!authData.user) {
        toast.error("Registration failed, please try again.");
        return;
      }

      // Step 2: Insert a new profile into the 'public.users' table.
      const { error: insertError } = await supabase
        .from("users")
        .insert([{
          user_id: authData.user.id,
          email: email,
          role: 'admin', // Assigning a default role
          department_id: departmentId, // Use the selected department ID
        }]);

      if (insertError) {
        // This is a critical error, as the user profile wasn't created
        console.error("Error creating user profile:", insertError);
        toast.error("Could not create user profile. Please contact support.");
        return;
      }

      toast.success("Registration successful! Please check your email to verify.");
      
      // Reset form and switch to login
      setEmail("");
      setPassword("");
      setDepartmentId("");
      setIsLogin(true);
      
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("An unexpected error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center mb-6">
          {isLogin ? "Admin Login" : "Admin Registration"}
        </h2>

        <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
            disabled={loading}
            minLength={6}
          />

          {!isLogin && (
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-300 mb-1">
                Department:
              </label>
              <select
                id="department"
                name="department"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2 bg-gray-700 border-2 border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Select Department --</option>
                {/* --- NEW: Dynamically generate options from fetched departments --- */}
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition disabled:bg-purple-400 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : (isLogin ? "Login" : "Register")}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          {isLogin ? (
            <>
              Not registered yet?{" "}
              <span
                onClick={() => !loading && setIsLogin(false)}
                className="text-purple-400 cursor-pointer hover:underline"
              >
                Sign up
              </span>
            </>
          ) : (
            <>
              Already registered?{" "}
              <span
                onClick={() => !loading && setIsLogin(true)}
                className="text-purple-400 cursor-pointer hover:underline"
              >
                Login
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
