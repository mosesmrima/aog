'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { useAuth } from '@/components/providers/auth-provider';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.is_approved) {
        router.push('/dashboard');
      } else {
        // Show pending approval message
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (user && !user.is_approved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md mx-auto backdrop-blur-lg bg-white/80 rounded-xl p-8 border border-white/20 shadow-2xl"
        >
          <div className="flex items-center justify-center mx-auto mb-6">
            <Image
              src="/oag-logo.png"
              alt="Office of the Attorney General and Department of Justice"
              width={180}
              height={45}
              className="h-10 w-auto"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Approval Pending
          </h2>
          <p className="text-gray-600 mb-6">
            Your account has been created successfully. Please wait for an administrator to approve your access before you can sign in.
          </p>
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="w-full"
          >
            Return Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="flex justify-center mb-4">
            <Image
              src="/oag-logo.png"
              alt="Office of the Attorney General and Department of Justice"
              width={200}
              height={50}
              className="h-10 sm:h-12 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">OAG Data Portal</h1>
        </motion.div>

        {isLogin ? <LoginForm /> : <RegisterForm />}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <p className="text-sm text-gray-600">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </p>
          <Button
            variant="link"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-700"
          >
            {isLogin ? 'Create Account' : 'Sign In'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}