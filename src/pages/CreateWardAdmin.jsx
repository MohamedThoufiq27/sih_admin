import React, { useState, useEffect, useRef } from 'react';
import { Copy, CheckCircle, User, Lock, MapPin, Building, Loader2, AlertCircle, Search, ChevronDown, X } from 'lucide-react';
// import { supabase } from '../supabase/supabase';
// Supabase client configuration
const SUPABASE_URL = 'https://oltzwasagaazcmrdsxiq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sdHp3YXNhZ2FhemNtcmRzeGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzMwNTEsImV4cCI6MjA3MjY0OTA1MX0.KpOXgj8gbnAoCzPCe-noPI9sj9D6HH_lBPSWyEtmXqY';

// Simple Supabase client implementation for data fetching
const supabase = {
  from: (table) => ({
    select: (columns = '*') => {
      const query = {
        select: columns,
        filters: [],
        orderBy: null
      };

      const buildQuery = () => {
        let url = `${SUPABASE_URL}/rest/v1/${table}?select=${query.select}`;
        
        // Add filters
        query.filters.forEach(filter => {
          url += `&${filter}`;
        });
        
        // Add order
        if (query.orderBy) {
          url += `&${query.orderBy}`;
        }
        
        return url;
      };

      const executeQuery = () => {
        return fetch(buildQuery(), {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        }).then(res => res.json()).then(data => ({ data, error: null })).catch(error => ({ data: null, error }));
      };

      return {
        eq: (column, value) => {
          query.filters.push(`${column}=eq.${value}`);
          return {
            order: (orderColumn, options = {}) => {
              query.orderBy = `order=${orderColumn}.${options.ascending !== false ? 'asc' : 'desc'}`;
              return executeQuery();
            },
            not: (column, operator, value) => {
              query.filters.push(`${column}=not.${operator}.${value}`);
              return {
                order: (orderColumn, options = {}) => {
                  query.orderBy = `order=${orderColumn}.${options.ascending !== false ? 'asc' : 'desc'}`;
                  return executeQuery();
                }
              };
            }
          };
        },
        order: (column, options = {}) => {
          query.orderBy = `order=${column}.${options.ascending !== false ? 'asc' : 'desc'}`;
          return executeQuery();
        }
      };
    }
  })
};

// Function to call the Edge Function
const createWardAdminViaEdgeFunction = async (userData, authToken) => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/smart-responder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || e.message;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Edge function error:', error);
    return { data: null, error: { message: error.message } };
  }
};

const CreateWardAdmin = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    selectedZone: '',
    selectedWard: ''
  });

  const [zones, setZones] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState({
    zones: false,
    wards: false,
    creating: false
  });
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [createdAdminData, setCreatedAdminData] = useState(null);

  // Search states
  const [zoneSearch, setZoneSearch] = useState('');
  const [wardSearch, setWardSearch] = useState('');
  const [showZoneDropdown, setShowZoneDropdown] = useState(false);
  const [showWardDropdown, setShowWardDropdown] = useState(false);

  // Refs for dropdown management
  const zoneDropdownRef = useRef(null);
  const wardDropdownRef = useRef(null);

  // Fetch unique zones from wards table
  const fetchZones = async () => {
    setLoading(prev => ({ ...prev, zones: true }));
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('wards')
        .select('zone_no, zone_name')
        .order('zone_name', { ascending: true });

      if (error) {
        throw new Error(error.message || 'Failed to fetch zones');
      }

      // Get unique zones
      const uniqueZones = [];
      const seenZones = new Set();
      
      (data || []).forEach(item => {
        if (item.zone_name && item.zone_no && !seenZones.has(item.zone_no)) {
          seenZones.add(item.zone_no);
          uniqueZones.push({
            id: item.zone_no,
            name: item.zone_name
          });
        }
      });

      setZones(uniqueZones);
    } catch (err) {
      setError(`Error loading zones: ${err.message}`);
      console.error('Error fetching zones:', err);
    } finally {
      setLoading(prev => ({ ...prev, zones: false }));
    }
  };

  // Fetch wards for selected zone from Supabase
  const fetchWards = async (zoneNo) => {
    if (!zoneNo) {
      setWards([]);
      return;
    }

    setLoading(prev => ({ ...prev, wards: true }));
    setError('');
    
    try {
      const { data, error } = await supabase
        .from('wards')
        .select('id, ward_no, zone_no, zone_name, area_value, perimeter')
        .eq('zone_no', zoneNo)
        .order('ward_no', { ascending: true });

      if (error) {
        throw new Error(error.message || 'Failed to fetch wards');
      }

      // Filter out wards with null ward_no on client side
      const filteredWards = (data || []).filter(ward => ward.ward_no !== null && ward.ward_no !== undefined);
      setWards(filteredWards);
    } catch (err) {
      setError(`Error loading wards: ${err.message}`);
      console.error('Error fetching wards:', err);
    } finally {
      setLoading(prev => ({ ...prev, wards: false }));
    }
  };

  // Load zones on component mount
  useEffect(() => {
    fetchZones();
  }, []);

  // Load wards when zone is selected
  useEffect(() => {
    if (formData.selectedZone) {
      fetchWards(formData.selectedZone);
      setFormData(prev => ({ ...prev, selectedWard: '' }));
      setWardSearch('');
    } else {
      setWards([]);
    }
  }, [formData.selectedZone]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (zoneDropdownRef.current && !zoneDropdownRef.current.contains(event.target)) {
        setShowZoneDropdown(false);
      }
      if (wardDropdownRef.current && !wardDropdownRef.current.contains(event.target)) {
        setShowWardDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Filter functions for search
  const filteredZones = zones.filter(zone =>
    zone.name.toLowerCase().includes(zoneSearch.toLowerCase())
  );

  const filteredWards = wards.filter(ward =>
    ward.ward_no.toString().includes(wardSearch) ||
    `ward ${ward.ward_no}`.toLowerCase().includes(wardSearch.toLowerCase())
  );

  // Handle zone selection
  const handleZoneSelect = (zone) => {
    handleInputChange('selectedZone', zone.id);
    setZoneSearch(zone.name);
    setShowZoneDropdown(false);
  };

  // Handle ward selection
  const handleWardSelect = (ward) => {
    handleInputChange('selectedWard', ward.id.toString());
    setWardSearch(`Ward ${ward.ward_no}`);
    setShowWardDropdown(false);
  };

  // Clear zone selection
  const clearZoneSelection = () => {
    handleInputChange('selectedZone', '');
    setZoneSearch('');
    setShowZoneDropdown(false);
  };

  // Clear ward selection
  const clearWardSelection = () => {
    handleInputChange('selectedWard', '');
    setWardSearch('');
    setShowWardDropdown(false);
  };

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password strength
  const isValidPassword = (password) => {
    return password.length >= 6; // Minimum 8 characters
  };

  // Create ward admin using Edge Function
  const createWardAdmin = async () => {
    setLoading(prev => ({ ...prev, creating: true }));
    setError('');

    try {
      // Validate inputs
      if (!isValidEmail(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      if (!isValidPassword(formData.password)) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Get the selected ward details
      const selectedWard = wards.find(w => w.id.toString() === formData.selectedWard);
      if (!selectedWard) {
        throw new Error('Selected ward not found');
      }

      // For this example, we'll use a mock auth token
      // In a real application, you would get this from your authenticated user session
      const authToken = SUPABASE_ANON_KEY; // Replace with actual user token

      // Prepare data for Edge Function
      const userData = {
        action: 'create_ward_admin',
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        ward_id: selectedWard.id,
        department_id: 1 // You may want to make this configurable
      };

      console.log('Creating ward admin via Edge Function...');

      const { data, error: edgeError } = await createWardAdminViaEdgeFunction(userData, authToken);

      if (edgeError) {
        console.error('Edge function error:', edgeError);
        throw new Error(edgeError.message || 'Failed to create ward admin');
      }

      if (!data || !data.success) {
        throw new Error('Ward admin creation failed: No success response');
      }

      console.log('Ward admin created successfully:', data);

      // Store created admin data for success display
      setCreatedAdminData(data.data);
      setIsSubmitted(true);

    } catch (err) {
      console.error('Error in createWardAdmin:', err);
      setError(`Error creating ward admin: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, creating: false }));
    }
  };

  const handleSubmit = () => {
    if (formData.name && formData.email && formData.password && formData.selectedZone && formData.selectedWard) {
      createWardAdmin();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      selectedZone: '',
      selectedWard: ''
    });
    setIsSubmitted(false);
    setCopiedField('');
    setError('');
    setZoneSearch('');
    setWardSearch('');
    setShowZoneDropdown(false);
    setShowWardDropdown(false);
    setCreatedAdminData(null);
  };

  // const getSelectedZoneName = () => {
  //   const zone = zones.find(z => z.id === formData.selectedZone);
  //   return zone ? zone.name : '';
  // };

  // const getSelectedWardName = () => {
  //   const ward = wards.find(w => w.id.toString() === formData.selectedWard);
  //   return ward ? `Ward ${ward.ward_no}` : '';
  // };

  if (isSubmitted && createdAdminData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Registration Successful!</h2>
            <p className="text-gray-600 mt-2">Ward admin credentials generated</p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="flex items-center justify-between bg-white rounded-lg border p-3">
                <span className="text-gray-800 font-mono text-sm truncate">{formData.email}</span>
                <button
                  onClick={() => copyToClipboard(formData.email, 'email')}
                  className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  {copiedField === 'email' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="flex items-center justify-between bg-white rounded-lg border p-3">
                <span className="text-gray-800 font-mono text-sm">{formData.password}</span>
                <button
                  onClick={() => copyToClipboard(formData.password, 'password')}
                  className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  {copiedField === 'password' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">Assignment Details</h3>
              <p className="text-sm text-blue-700"><strong>Name:</strong> {createdAdminData.name}</p>
              <p className="text-sm text-blue-700"><strong>Zone:</strong> {createdAdminData.ward.zone_name}</p>
              <p className="text-sm text-blue-700"><strong>Ward:</strong> Ward {createdAdminData.ward.ward_no}</p>
              <p className="text-sm text-blue-700"><strong>User ID:</strong> {createdAdminData.user_id}</p>
            </div>
          </div>

          <button
            onClick={resetForm}
            className="w-full mt-6 bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Register Another Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Ward Admin Registration</h1>
          <p className="text-gray-600 mt-2">Create new ward administrator account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-red-700 text-sm">
              <p>{error}</p>
              <p className="text-xs mt-1 text-red-600">Check the console for more details</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="admin@example.com"
            />
            {formData.email && !isValidEmail(formData.email) && (
              <p className="text-red-500 text-xs mt-1">Please enter a valid email address</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Enter secure password (min 6 characters)"
            />
            {formData.password && !isValidPassword(formData.password) && (
              <p className="text-red-500 text-xs mt-1">Password must be at least 6 characters long</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Select Zone
            </label>
            <div className="relative" ref={zoneDropdownRef}>
              <div className="relative">
                <input
                  type="text"
                  value={zoneSearch}
                  onChange={(e) => {
                    setZoneSearch(e.target.value);
                    setShowZoneDropdown(true);
                    if (!e.target.value) {
                      clearZoneSelection();
                    }
                  }}
                  onFocus={() => setShowZoneDropdown(true)}
                  placeholder={loading.zones ? 'Loading zones...' : 'Search zones...'}
                  disabled={loading.zones}
                  className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  {zoneSearch && (
                    <button
                      onClick={clearZoneSelection}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                  {loading.zones ? (
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {showZoneDropdown && !loading.zones && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredZones.length > 0 ? (
                    filteredZones.map(zone => (
                      <button
                        key={zone.id}
                        onClick={() => handleZoneSelect(zone)}
                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          {zone.name}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-center">
                      No zones found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {formData.selectedZone && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="w-4 h-4 inline mr-2" />
                Select Ward
              </label>
              <div className="relative" ref={wardDropdownRef}>
                <div className="relative">
                  <input
                    type="text"
                    value={wardSearch}
                    onChange={(e) => {
                      setWardSearch(e.target.value);
                      setShowWardDropdown(true);
                      if (!e.target.value) {
                        clearWardSelection();
                      }
                    }}
                    onFocus={() => setShowWardDropdown(true)}
                    placeholder={loading.wards ? 'Loading wards...' : 'Search wards...'}
                    disabled={loading.wards}
                    className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    {wardSearch && (
                      <button
                        onClick={clearWardSelection}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                    {loading.wards ? (
                      <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {showWardDropdown && !loading.wards && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredWards.length > 0 ? (
                      filteredWards.map(ward => (
                        <button
                          key={ward.id}
                          onClick={() => handleWardSelect(ward)}
                          className="w-full text-left px-4 py-3 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center">
                            <Building className="w-4 h-4 text-gray-400 mr-2" />
                            Ward {ward.ward_no}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-center">
                        No wards found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!formData.name || !formData.email || !formData.password || !formData.selectedZone || !formData.selectedWard || loading.zones || loading.wards || loading.creating || !isValidEmail(formData.email) || !isValidPassword(formData.password)}
          >
            {loading.zones || loading.wards || loading.creating ? (
              <>
                <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                {loading.creating ? 'Creating Admin...' : 'Loading...'}
              </>
            ) : (
              'Register Ward Admin'
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Department Administration Portal
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateWardAdmin;