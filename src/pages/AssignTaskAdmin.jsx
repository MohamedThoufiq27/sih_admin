import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Copy } from "lucide-react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AssignTaskAdmin() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [departments, setDepartments] = useState([]);
    const [saved, setSaved] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch departments from Supabase
    useEffect(() => {
        const fetchDepartments = async () => {
            const { data, error } = await supabase.from("departments").select("*");
            if (error) {
                console.error("Error fetching departments:", error);
            } else {
                setDepartments(data);
            }
        };
        fetchDepartments();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            console.log("=== DEBUG INFO ===");
            console.log("Supabase URL:", supabaseUrl);
            console.log("Anon Key:", supabaseAnonKey ? "Present" : "Missing");
            console.log("Data being sent:", { name, email, password, department_id: departmentId });

            // Method 1: Try supabase.functions.invoke first
            try {
                const { data, error } = await supabase.functions.invoke('bright-processor', {
                    body: {
                        name,
                        email,
                        password,
                        department_id: departmentId,
                    },
                });

                console.log("Supabase invoke - Response data:", data);
                console.log("Supabase invoke - Response error:", error);

                if (error) {
                    throw new Error(error.message);
                }

                setSaved({ name, email, password, departmentId });
                setName("");
                setEmail("");
                setPassword("");
                setDepartmentId("");
                alert(data?.message || "Admin created successfully!");
                return;

            } catch (invokeError) {
                console.warn("supabase.functions.invoke failed:", invokeError);
                console.log("Trying direct fetch...");
            }

            // Method 2: Direct fetch as fallback
            const response = await fetch(`${supabaseUrl}/functions/v1/bright-processor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    department_id: departmentId,
                }),
            });

            console.log("Fetch response status:", response.status);
            console.log("Fetch response headers:", Object.fromEntries(response.headers));

            const responseText = await response.text();
            console.log("Raw response:", responseText);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${responseText}`);
            }

            const result = JSON.parse(responseText);
            console.log("Parsed result:", result);

            if (result.error) {
                throw new Error(result.error);
            }

            setSaved({ name, email, password, departmentId });
            setName("");
            setEmail("");
            setPassword("");
            setDepartmentId("");
            alert(result?.message || "Admin created successfully!");

        } catch (err) {
            console.error("Final error:", err);
            alert("Error: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

    const resetForm = () => {
        setSaved(null);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
            <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                    Create Department Admin
                </h2>

                {!saved ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={isLoading}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                placeholder="Enter admin name"
                            />
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                placeholder="Enter admin email"
                            />
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                placeholder="Enter password"
                                minLength="6"
                            />
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-700">Department</label>
                            <select
                                value={departmentId}
                                onChange={(e) => setDepartmentId(e.target.value)}
                                required
                                disabled={isLoading}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                            >
                                <option value="">Select Department</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition"
                        >
                            {isLoading ? "Creating..." : "Submit"}
                        </button>
                    </form>
                )
                    : (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-green-600 mb-4">
                                    Admin Created Successfully! 🎉
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Please save these credentials securely:
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">NAME</label>
                                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                                        <span className="text-gray-800 font-mono">{saved.name}</span>
                                        <button
                                            onClick={() => handleCopy(saved.name)}
                                            className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                                            title="Copy to clipboard"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">EMAIL</label>
                                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                                        <span className="text-gray-800 font-mono">{saved.email}</span>
                                        <button
                                            onClick={() => handleCopy(saved.email)}
                                            className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                                            title="Copy to clipboard"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">PASSWORD</label>
                                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                                        <span className="text-gray-800 font-mono">{saved.password}</span>
                                        <button
                                            onClick={() => handleCopy(saved.password)}
                                            className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                                            title="Copy to clipboard"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={resetForm}
                                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                                Create Another Admin
                            </button>
                        </div>
                    )}
            </div>
        </div>
    );
}