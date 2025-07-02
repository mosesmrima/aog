'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, UserPlus, Mail, Lock, User, Building, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { signUp, getDepartments } from '@/lib/auth';

interface Department {
  id: string;
  name: string;
  description: string | null;
}

export function RegisterForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setIsDepartmentsLoading(true);
        console.log('Fetching departments...');
        
        const depts = await getDepartments();
        console.log('Departments loaded:', depts);
        
        setDepartments(depts || []);
      } catch (error) {
        console.error('Error in fetchDepartments:', error);
        toast({
          title: 'Error loading departments',
          description: 'Please check your connection and try again.',
          variant: 'destructive',
        });
        // Set a default department if all else fails
        setDepartments([{
          id: 'default',
          name: 'Registrar of Marriages',
          description: 'Default department'
        }]);
      } finally {
        setIsDepartmentsLoading(false);
      }
    };

    fetchDepartments();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'Passwords do not match. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedDepartment) {
      toast({
        title: 'Department required',
        description: 'Please select a department.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting to sign up with:', { email, fullName, selectedDepartment });
      await signUp(email, password, fullName, selectedDepartment);
      
      // Set success state
      setIsSuccess(true);
      
      toast({
        title: '🎉 Registration Successful!',
        description: 'Your account has been created and assigned to the selected department. An administrator will review and approve your account shortly. You will receive an email notification once approved.',
        duration: 8000, // Show for 8 seconds
      });
      
      // Clear form after a brief delay
      setTimeout(() => {
        setFullName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setSelectedDepartment('');
      }, 1000);
      
      // Redirect to auth page after showing success message
      setTimeout(() => {
        router.push('/auth');
      }, 4000); // 4 second delay to show success state and toast
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Please try again.';
      
      if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists.';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message?.includes('Password')) {
        errorMessage = 'Password must be at least 6 characters long.';
      } else if (error.message?.includes('Email rate limit exceeded')) {
        errorMessage = 'Too many registration attempts. Please wait a moment and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-md mx-auto backdrop-blur-lg bg-white/80 border-white/20 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create Account
          </CardTitle>
          <CardDescription>
            Register to access the OAG Data Portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="text-center space-y-6 py-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="flex justify-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              </motion.div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  Registration Successful! 🎉
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Your account has been created and assigned to <strong>{departments.find(d => d.id === selectedDepartment)?.name}</strong>
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <p className="text-sm text-blue-800">
                      <strong>Next Steps:</strong> An administrator will review and approve your account. Once approved, you'll be able to login with your credentials. Contact your department admin if you need urgent access.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Redirecting to login page in a few seconds...
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder={isDepartmentsLoading ? "Loading departments..." : "Select your department"} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {isDepartmentsLoading ? (
                    <SelectItem value="loading" disabled>Loading departments...</SelectItem>
                  ) : departments.length === 0 ? (
                    <SelectItem value="none" disabled>No departments available</SelectItem>
                  ) : (
                    departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {departments.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Found {departments.length} department{departments.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-10 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || isDepartmentsLoading}>
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>
          </form>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}