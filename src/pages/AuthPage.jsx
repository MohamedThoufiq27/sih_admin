import { useState } from "react"
import { supabase } from "../supabase/supabase"
import { toast } from "react-toastify"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [department,setDepartment] = useState('');
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        alert(error.message)
        return
      }

      const user = data.user
      if (user) {
        const { error: profileError } = await supabase
          .from("users")
          .select("department")
          .eq("user_id", user.id)
          .single()
          
        if (profileError) {
          console.error("Profile fetch error:", profileError)
        }
        
        toast.success(`Login successful!`)
        
      }
    
    } catch (err) {
      console.error("Login error:", err)
      alert("An unexpected error occurred during login")
    } finally {
      setLoading(false)
    }
  }

  // Handle Register - Fixed version with metadata approach
  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Sign up the user with department in metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            department: department, // Store department in user metadata
            role:'admin',
            email: email
          }
        }
      })

      if (error) {
        alert(error.message)
        return
      }

      console.log("Signup data:", data) // Debug log

      // If using the trigger approach, the user profile will be created automatically
      // If not using triggers, manually insert the data
      const userId = data.user?.id

      if (!userId) {
        alert("User ID not found after registration")
        return
      }

      // Try to insert manually as backup (in case trigger doesn't work)
      try {
        const { data: insertData, error: insertError } = await supabase
          .from("users")
          .upsert([{
            user_id: userId,
            department: department,
            role:'admin',
            email: email,
            created_at: new Date().toISOString()
          }], {
            onConflict: 'user_id'
          })
          .select()

        if (insertError) {
          console.error("Manual insert error:", insertError)
          // Don't show error to user if this fails, as trigger might have handled it
        } else {
          console.log("Manual insert successful:", insertData)
        }
      } catch (manualInsertErr) {
        console.log("Manual insert failed (trigger might have handled it):", manualInsertErr)
      }

      toast.success("Registration successful!")
      
      // Reset form
      setEmail("")
      setPassword("")
      setDepartment("")
      setIsLogin(true) // Switch to login mode
      
    } catch (err) {
      console.error("Registration error:", err)
      alert("An unexpected error occurred during registration")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-primary">
      <div className="w-full max-w-md bg-linear-to-br from-[#C04848] to-[#480048] rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isLogin ? "Login" : "Register"}
        </h2>

        <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border-2 border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border-2 border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
            minLength={6}
          />

          {!isLogin && (
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-200 mb-1">
                Department:
              </label>
              <select
                id="department"
                name="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2 border-2 border-zinc-700 text-zinc-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Department --</option>
                <option value="Water Supply">Water Supply</option>
                <option value="Roads">Roads</option>
                <option value="Sewage">Sewage</option>
                <option value="Sanitation">Sanitation</option>
                <option value="Electricity">Electricity</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
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
                className="text-blue-600 cursor-pointer hover:underline"
              >
                Sign up
              </span>
            </>
          ) : (
            <>
              Already registered?{" "}
              <span
                onClick={() => !loading && setIsLogin(true)}
                className="text-blue-600 cursor-pointer hover:underline"
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