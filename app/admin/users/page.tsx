'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Users, CheckCircle, XCircle, Edit, Trash2, Plus, UserCheck, UserX } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  is_approved: boolean;
  created_at: string;
  departments: { name: string }[];
}

interface Department {
  id: string;
  name: string;
}

export default function UsersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || !user.is_approved || !user.is_admin)) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.is_admin) {
      fetchUsers();
      fetchDepartments();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          user_departments (
            departments (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedUsers = data.map(user => ({
        ...user,
        departments: user.user_departments?.map(ud => ud.departments) || []
      }));

      setUsers(formattedUsers);
    } catch (error: any) {
      toast({
        title: 'Error loading users',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error: any) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleApproveUser = async (userId: string, approve: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_approved: approve })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: approve ? 'User approved' : 'User rejected',
        description: `User has been ${approve ? 'approved' : 'rejected'} successfully.`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error updating user',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_admin: !isAdmin })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Admin status updated',
        description: `User ${!isAdmin ? 'promoted to' : 'removed from'} admin role.`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error updating admin status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAssignDepartment = async (userId: string, departmentId: string) => {
    try {
      // Check if user is already assigned to this department
      const { data: existing } = await supabase
        .from('user_departments')
        .select('id')
        .eq('user_id', userId)
        .eq('department_id', departmentId)
        .maybeSingle();

      if (existing) {
        toast({
          title: 'User already assigned',
          description: 'User is already assigned to this department.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('user_departments')
        .insert({
          user_id: userId,
          department_id: departmentId,
        });

      if (error) throw error;

      toast({
        title: 'Department assigned',
        description: 'User has been assigned to the department successfully.',
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error assigning department',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading || isLoadingUsers) {
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

  const approvedUsers = users.filter(u => u.is_approved);
  const pendingUsers = users.filter(u => !u.is_approved);
  const adminUsers = users.filter(u => u.is_admin);

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
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600">Manage user accounts, approvals, and permissions</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Approved</p>
                      <p className="text-2xl font-bold text-green-600">{approvedUsers.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-amber-600">{pendingUsers.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Admins</p>
                      <p className="text-2xl font-bold text-purple-600">{adminUsers.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Users Table */}
            <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  Manage user accounts, approvals, and department assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Departments</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((userData) => (
                        <TableRow key={userData.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{userData.full_name}</p>
                              <p className="text-sm text-gray-500">{userData.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={userData.is_approved ? "default" : "secondary"}
                              className={userData.is_approved ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}
                            >
                              {userData.is_approved ? "Approved" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={userData.is_admin ? "default" : "outline"}
                              className={userData.is_admin ? "bg-purple-100 text-purple-800" : ""}
                            >
                              {userData.is_admin ? "Admin" : "User"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {userData.departments.map((dept, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {dept.name}
                                </Badge>
                              ))}
                              {userData.departments.length === 0 && (
                                <span className="text-sm text-gray-400">No departments</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-500">
                              {new Date(userData.created_at).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {!userData.is_approved && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveUser(userData.id, true)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleApproveUser(userData.id, false)}
                                  >
                                    <UserX className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleAdmin(userData.id, userData.is_admin)}
                              >
                                {userData.is_admin ? "Remove Admin" : "Make Admin"}
                              </Button>
                              <Select onValueChange={(value) => handleAssignDepartment(userData.id, value)}>
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Assign Dept" />
                                </SelectTrigger>
                                <SelectContent>
                                  {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                      {dept.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}