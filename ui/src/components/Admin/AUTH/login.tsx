import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { X, Phone, Lock, KeyRound, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

// GraphQL Mutations matching your backend resolvers
const ADMIN_LOGIN = gql`
  mutation AdminLogin($input: LoginInput!) {
    adminLogin(input: $input) {
      success
      message
      otpSent
    }
  }
`;

const VERIFY_OTP_ADMIN = gql`
  mutation VerifyOtpAdmin($number: String!, $otp: String!) {
    verifyOtpAdmin(number: $number, otp: $otp) {
      success
      message
      IsValid
    }
  }
`;

const RESEND_ADMIN_OTP = gql`
  mutation ResendAdminOtp($number: String!) {
    resendAdminOtp(number: $number) {
      success
      message
      otpSent
    }
  }
`;

// TypeScript interfaces
interface LoginInput {
  number: string;
  password: string;
}

interface OtpResponse {
  success: boolean;
  message: string;
  otpSent?: boolean;
  IsValid?: boolean;
}

interface AdminLoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

type LoginStep = 'credentials' | 'otp' | 'success';

export const AdminLoginDialog: React.FC<AdminLoginDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError
}) => {
  const [step, setStep] = useState<LoginStep>('credentials');
  const [formData, setFormData] = useState({
    number: '',
    password: '',
    otp: ''
  });
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(0);

  // GraphQL mutations
  const [adminLogin, { loading: loginLoading }] = useMutation<
    { adminLogin: OtpResponse },
    { input: LoginInput }
  >(ADMIN_LOGIN);

  const [verifyOtpAdmin, { loading: otpLoading }] = useMutation<
    { verifyOtpAdmin: OtpResponse },
    { number: string; otp: string }
  >(VERIFY_OTP_ADMIN);

  const [resendAdminOtp, { loading: resendLoading }] = useMutation<
    { resendAdminOtp: OtpResponse },
    { number: string }
  >(RESEND_ADMIN_OTP);

  // Handle input changes
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  // Handle admin login (send OTP)
  const handleLogin = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validation
    if (!formData.number.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!formData.password.trim()) {
      setError('Password is required');
      return;
    }

    try {
      const { data } = await adminLogin({
        variables: {
          input: {
            number: formData.number.trim(),
            password: formData.password
          }
        }
      });

      if (data?.adminLogin?.success) {
        setStep('otp');
        setSuccessMessage(data.adminLogin.message);
        startResendCountdown();
      } else {
        setError(data?.adminLogin?.message || 'Login failed');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.graphQLErrors?.[0]?.message || 
                          err.networkError?.message || 
                          'Login failed. Please try again.';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  // Handle OTP verification
  const handleOtpVerification = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMessage("");

    // Validation
    if (!formData.otp.trim()) {
      setError('Please enter the OTP');
      return;
    }
    if (formData.otp.length !== 10) {
      setError('OTP must be 4 -10 digits');
      return;
    }

    try {
      const { data } = await verifyOtpAdmin({
        variables: {
          number: formData.number.trim(),
          otp: formData.otp.trim()
        }
      });

      if (data?.verifyOtpAdmin?.success && data?.verifyOtpAdmin?.IsValid) {
        setStep('success');
        setSuccessMessage('Login successful!');
        
        // Auto-close after success
        setTimeout(() => {
          handleClose();
          if (onSuccess) {
            onSuccess();
          }
        }, 2000);
      } else {
        setError(data?.verifyOtpAdmin?.message || 'OTP verification failed');
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      const errorMessage = err.graphQLErrors?.[0]?.message || 
                          err.networkError?.message || 
                          'OTP verification failed. Please try again.';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    setError('');
    setSuccessMessage('');

    try {
      const { data } = await resendAdminOtp({
        variables: {
          number: formData.number.trim()
        }
      });

      if (data?.resendAdminOtp?.success) {
        setSuccessMessage('OTP resent successfully');
        startResendCountdown();
      } else {
        setError(data?.resendAdminOtp?.message || 'Failed to resend OTP');
      }
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      const errorMessage = err.graphQLErrors?.[0]?.message || 
                          'Failed to resend OTP';
      setError(errorMessage);
    }
  };

  // Start countdown for resend button
  const startResendCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle dialog close
  const handleClose = () => {
    setStep('credentials');
    setFormData({ number: '', password: '', otp: '' });
    setError('');
    setSuccessMessage('');
    setCountdown(0);
    onClose();
  };

  // Go back to credentials step
  const handleBackToCredentials = () => {
    setStep('credentials');
    setFormData(prev => ({ ...prev, otp: '' }));
    setError('');
    setSuccessMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">
            {step === 'credentials' && 'Admin Login'}
            {step === 'otp' && 'Verify OTP'}
            {step === 'success' && 'Login Successful'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
            disabled={loginLoading || otpLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Credentials Step */}
          {step === 'credentials' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.number}
                    onChange={(e) => handleInputChange('number', e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your phone number"
                    disabled={loginLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your password"
                    disabled={loginLoading}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="flex items-center space-x-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
                  <CheckCircle size={16} />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loginLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Sending OTP...
                  </>
                ) : (
                  'Login & Send OTP'
                )}
              </button>
            </div>
          )}

          {/* OTP Verification Step */}
          {step === 'otp' && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-gray-600 mb-2">
                  We've sent an OTP to
                </p>
                <p className="font-medium text-gray-800">{formData.number}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                  Enter 4-10 digit OTP
                </label>
                <input
                  type="text"
                  value={formData.otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    handleInputChange('otp', value);
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleOtpVerification(e)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  maxLength={10}
                  disabled={otpLoading}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="flex items-center space-x-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
                  <CheckCircle size={16} />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                onClick={handleOtpVerification}
                disabled={otpLoading || formData.otp.length !== 10}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium"
              >
                {otpLoading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </button>

              <div className="flex flex-col space-y-2">
                <button
                  onClick={handleResendOtp}
                  disabled={resendLoading || countdown > 0}
                  className="text-blue-600 hover:text-blue-800 text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {resendLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin h-4 w-4 mr-1" />
                      Resending...
                    </span>
                  ) : countdown > 0 ? (
                    `Resend OTP in ${countdown}s`
                  ) : (
                    'Resend OTP'
                  )}
                </button>

                <button
                  onClick={handleBackToCredentials}
                  className="text-gray-600 hover:text-gray-800 text-sm py-2 font-medium"
                >
                  ← Back to Login
                </button>
              </div>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Login Successful!</h3>
              <p className="text-gray-600 mb-4">Welcome back, admin!</p>
              <div className="w-full bg-green-200 rounded-full h-1">
                <div className="bg-green-600 h-1 rounded-full animate-pulse"></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Redirecting...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
