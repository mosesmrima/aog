'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Building, Shield, UserCheck, UserX } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  is_approved: boolean;
  created_at: string;
  departments?: string[];
}

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || !user.is_admin || !user.is_approved)) {
      router.push('/auth');
    }
  }, [user, isLoading, router]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          user_departments (
            departments (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersWithDepartments = data?.map(user => ({
        ...user,
        departments: user.user_departments?.map((ud: any) => ud.departments.name) || []
      })) || [];

      setUsers(usersWithDepartments);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users.',
        variant: 'destructive',
      });
    } finally {
      setIsUsersLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_admin) {
      fetchUsers();
    }
  }, [user]);

  const handleApproveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_approved: true })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'User approved',
        description: 'User has been successfully approved.',
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve user.',
        variant: 'destructive',
      });
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_approved: false })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'User access revoked',
        description: 'User access has been revoked.',
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke user access.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleAdmin = async (userId: string, currentAdminStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_admin: !currentAdminStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: currentAdminStatus ? 'Admin privileges removed' : 'Admin privileges granted',
        description: `User ${currentAdminStatus ? 'is no longer' : 'is now'} an administrator.`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update admin status.',
        variant: 'destructive',
      });
    }
  };

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

  if (!user || !user.is_admin || !user.is_approved) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Sidebar />
      <main className="lg:pl-64">
        <div className="p-6 lg:p-8 pt-16 lg:pt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Panel
            </h1>
            <p className="text-gray-600">
              Manage users, departments, and system settings
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                  <UserCheck className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {users.filter(u => !u.is_approved).length}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                  <Shield className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {users.filter(u => u.is_admin).length}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-blue-500" />
                    <span>Quick Actions</span>
                  </CardTitle>
                  <CardDescription>
                    Common administrative tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => router.push('/admin/departments')}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Building className="mr-2 h-4 w-4" />
                    Manage Departments
                  </Button>
                  <Button 
                    onClick={() => router.push('/admin/users')}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Button>
                  <Button 
                    onClick={() => router.push('/audit')}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    View Audit Logs
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle>Recent User Activity</CardTitle>
                  <CardDescription>
                    Latest user registrations and status changes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {users.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-sm">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <div className="flex space-x-1">
                        {user.is_admin && (
                          <Badge variant="secondary" className="text-xs">Admin</Badge>
                        )}
                        <Badge 
                          variant={user.is_approved ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {user.is_approved ? 'Approved' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <span>User Management</span>
                </CardTitle>
                <CardDescription>
                  Approve, manage, and configure user access
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isUsersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No users found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((userProfile) => (
                          <TableRow key={userProfile.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{userProfile.full_name}</p>
                                <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {userProfile.departments && userProfile.departments.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {userProfile.departments.map((dept, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {dept}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No department</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={userProfile.is_approved ? "default" : "destructive"}
                              >
                                {userProfile.is_approved ? 'Approved' : 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={userProfile.is_admin ? "secondary" : "outline"}
                              >
                                {userProfile.is_admin ? 'Admin' : 'User'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {!userProfile.is_approved ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleApproveUser(userProfile.id)}
                                  >
                                    <UserCheck className="h-4 w-4 text-green-500" />
                                  </Button>
                                ) : (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <UserX className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Revoke Access</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to revoke access for {userProfile.full_name}? They will no longer be able to access the system.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleRejectUser(userProfile.id)}
                                          className="bg-red-500 hover:bg-red-600"
                                        >
                                          Revoke Access
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Shield className={`h-4 w-4 ${userProfile.is_admin ? 'text-purple-500' : 'text-gray-400'}`} />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        {userProfile.is_admin ? 'Remove Admin' : 'Grant Admin'} Privileges
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to {userProfile.is_admin ? 'remove admin privileges from' : 'grant admin privileges to'} {userProfile.full_name}?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleToggleAdmin(userProfile.id, userProfile.is_admin)}
                                      >
                                        {userProfile.is_admin ? 'Remove Admin' : 'Grant Admin'}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}