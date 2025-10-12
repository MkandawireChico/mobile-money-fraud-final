// client/src/components/users/UserForm.tsx
import React, { useState } from 'react'; // Removed useEffect as it was unused
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../api/axios.ts'; // Assuming your axios instance is correctly configured
import { Loader2 } from 'lucide-react'; // Added Loader2 for loading spinner

// Define UserData interface
interface UserData {
    id?: string;
    name: string;
    username: string;
    email: string;
    role: 'admin' | 'analyst' | 'viewer';
    status?: 'active' | 'suspended';
    lastLogin?: string;
}

// Define props for the UserForm component
interface UserFormProps {
    mode: 'create' | 'edit'; // Determines if the form is for creating or editing a user
    user?: UserData; // Optional user data for edit mode
    onSuccess: () => void; // Callback function for successful form submission
    onCancel: () => void; // Callback function for cancelling the form
}

const UserForm: React.FC<UserFormProps> = ({
    mode,
    user,
    onSuccess,
    onCancel
}) => {
    // State for managing loading status during API calls
    const [loading, setLoading] = useState(false);
    // State for displaying general form errors (e.g., from API responses)
    const [error, setError] = useState('');

    // Yup validation schema for form fields
    const validationSchema = Yup.object().shape({
        name: Yup.string()
            .required('Full Name is required')
            .max(100, 'Full Name cannot exceed 100 characters'),
        username: Yup.string()
            .required('Username is required')
            .min(3, 'Username must be at least 3 characters')
            .max(255, 'Username cannot exceed 255 characters'),
        email: Yup.string()
            .email('Invalid email address')
            .required('Email is required')
            .max(100, 'Email cannot exceed 100 characters'),
        role: Yup.string()
            .oneOf(['admin', 'analyst', 'viewer'], 'Invalid role selected')
            .required('Role is required'),
        // Conditional validation for password fields based on form mode
        ...(mode === 'create' && {
            password: Yup.string()
                .min(8, 'Password must be at least 8 characters')
                .max(50, 'Password cannot exceed 50 characters')
                .required('Password is required')
                .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
                .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
                .matches(/[0-9]/, 'Password must contain at least one digit')
                .matches(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref('password')], 'Passwords must match')
                .required('Confirm password is required')
        }),
        ...(mode === 'edit' && {
            password: Yup.string()
                .min(8, 'Password must be at least 8 characters')
                .max(50, 'Password cannot exceed 50 characters')
                .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
                .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
                .matches(/[0-9]/, 'Password must contain at least one digit')
                .matches(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')
                .nullable()
                .transform((value, originalValue) => originalValue === '' ? null : value), // Transforms empty string to null for optional password
        })
    });

    // Formik hook for managing form state, validation, and submission
    const formik = useFormik({
        initialValues: {
            name: user?.name || '',
            username: user?.username || '',
            email: user?.email || '',
            role: user?.role || 'analyst', // Default role for create mode
            password: '',
            confirmPassword: '',
        },
        validationSchema,
        enableReinitialize: true, // Reinitialize form values when 'user' prop changes in edit mode
        onSubmit: async (values) => {
            try {
                setLoading(true); // Set loading to true on form submission
                setError('');     // Clear any previous errors

                // Prepare data to send to the API, excluding confirmPassword
                const dataToSend: Partial<UserData & { password?: string }> = {
                    name: values.name,
                    username: values.username,
                    email: values.email,
                    role: values.role,
                };

                // Logic for creating a new user
                if (mode === 'create') {
                    dataToSend.password = values.password;
                    console.log('[UserForm] Attempting POST request to: /users with data:', dataToSend);
                    await api.post('/users', dataToSend);
                    console.log('User created successfully!');
                }
                // Logic for updating an existing user
                else if (user?.id) {
                    // Only include password in update if it's provided (not empty)
                    if (values.password) {
                        dataToSend.password = values.password;
                    }
                    console.log(`[UserForm] Attempting PUT request to: /users/${user.id} with data:`, dataToSend);
                    await api.put(`/users/${user.id}`, dataToSend);
                    console.log(`User ${user.id} updated successfully!`);
                }

                onSuccess(); // Call onSuccess callback after successful operation
            } catch (err: any) {
                // Error handling for API calls
                console.error('[UserForm] Error saving user:', err.response?.data?.message || err.message);
                setError(err.response?.data?.message || 'An unexpected error occurred.');
            } finally {
                setLoading(false); // Reset loading state
            }
        },
    });

    // Tailwind CSS classes for consistent input styling
    const inputClasses = (isInvalid: boolean | undefined, isDisabled: boolean = false) =>
        `w-full px-4 py-2.5 border rounded-lg focus:outline-none transition-all duration-150 ease-in-out
         ${isInvalid ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'}
         ${isDisabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'}`;

    const errorTextClasses = "text-red-500 text-sm mt-1";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

    return (
        // Form container with Tailwind styling for padding and layout
        <form onSubmit={formik.handleSubmit} className="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            {/* Display general error message if any */}
            {error && (
                <div className="text-red-600 dark:text-red-100 bg-red-100 dark:bg-red-900 p-4 rounded-lg text-center border border-red-200 dark:border-red-700">
                    {error}
                </div>
            )}

            {/* Grid layout for form fields, responsive design with grid-cols */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Full Name Field */}
                <div>
                    <label htmlFor="name" className={labelClasses}>
                        Full Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Enter full name"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={inputClasses(formik.touched.name && Boolean(formik.errors.name))}
                    />
                    {formik.touched.name && formik.errors.name && (
                        <p className={errorTextClasses}>{formik.errors.name}</p>
                    )}
                </div>

                {/* Username Field */}
                <div>
                    <label htmlFor="username" className={labelClasses}>
                        Username
                    </label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        placeholder="Enter username"
                        value={formik.values.username}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={inputClasses(formik.touched.username && Boolean(formik.errors.username))}
                    />
                    {formik.touched.username && formik.errors.username && (
                        <p className={errorTextClasses}>{formik.errors.username}</p>
                    )}
                </div>

                {/* Email Field (disabled in edit mode) */}
                <div className="sm:col-span-2">
                    <label htmlFor="email" className={labelClasses}>
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Enter email address"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={inputClasses(formik.touched.email && Boolean(formik.errors.email), mode === 'edit')}
                        disabled={mode === 'edit'}
                    />
                    {formik.touched.email && formik.errors.email && (
                        <p className={errorTextClasses}>{formik.errors.email}</p>
                    )}
                </div>

                {/* Role Selection */}
                <div className="sm:col-span-2 relative">
                    <label htmlFor="role" className={labelClasses}>
                        Role
                    </label>
                    <select
                        id="role"
                        name="role"
                        value={formik.values.role}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`${inputClasses(formik.touched.role && Boolean(formik.errors.role))} appearance-none`}
                    >
                        <option value="admin">Admin</option>
                        <option value="analyst">Analyst</option>
                        <option value="viewer">Viewer</option>
                    </select>
                    {/* Custom arrow for the select input using Tailwind + SVG */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 top-8 flex items-center px-3 text-gray-700 dark:text-gray-300">
                        <svg className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                    </div>
                    {formik.touched.role && formik.errors.role && (
                        <p className={errorTextClasses}>{formik.errors.role}</p>
                    )}
                </div>

                {/* Password Fields (Conditional based on mode) */}
                {mode === 'create' && (
                    <>
                        {/* New Password Field for Create Mode */}
                        <div>
                            <label htmlFor="password" className={labelClasses}>
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Enter password"
                                value={formik.values.password}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                className={inputClasses(formik.touched.password && Boolean(formik.errors.password))}
                            />
                            {formik.touched.password && formik.errors.password && (
                                <p className={errorTextClasses}>{formik.errors.password}</p>
                            )}
                        </div>
                        {/* Confirm Password Field for Create Mode */}
                        <div>
                            <label htmlFor="confirmPassword" className={labelClasses}>
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder="Confirm password"
                                value={formik.values.confirmPassword}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                className={inputClasses(formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword))}
                            />
                            {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                                <p className={errorTextClasses}>{formik.errors.confirmPassword}</p>
                            )}
                        </div>
                    </>
                )}

                {mode === 'edit' && (
                    <div className="sm:col-span-2">
                        <label htmlFor="password" className={labelClasses}>
                            New Password (leave blank to keep current)
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Enter new password (optional)"
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className={inputClasses(formik.touched.password && Boolean(formik.errors.password))}
                        />
                        {formik.touched.password && formik.errors.password && (
                            <p className={errorTextClasses}>{formik.errors.password}</p>
                        )}
                    </div>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex justify-end pt-6 space-x-4 border-t border-gray-200 dark:border-gray-700 mt-6">
                {/* Cancel Button */}
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-base font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                >
                    Cancel
                </button>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="relative inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-offset-gray-800 transition-colors duration-200 text-base"
                >
                    {loading ? (
                        <>
                            {mode === 'create' ? 'Creating...' : 'Updating...'}
                            <Loader2 size={20} className="animate-spin ml-2" />
                        </>
                    ) : (
                        mode === 'create' ? 'Create User' : 'Update User'
                    )}
                </button>
            </div>
        </form>
    );
};

export default UserForm;
