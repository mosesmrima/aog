'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FileText, Filter, Search, Calendar, User, Database, Activity } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_values: any;
  new_values: any;
  department_id: string;
  created_at: string;
  user_profiles: {
    full_name: string;
    email: string;
  } | null;
  departments: {
    name: string;
  } | null;
}

export default function AuditPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [tableFilter, setTableFilter] = useState('all');

  useEffect(() => {
    if (!isLoading && (!user || !user.is_approved || !user.is_admin)) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.is_admin) {
      fetchAuditLogs();
    }
  }, [user]);

  const fetchAuditLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user_profiles (
            full_name,
            email
          ),
          departments (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100); // Limit to last 100 records for performance

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading audit logs',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.user_profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_profiles?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.record_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter.toUpperCase();
    const matchesTable = tableFilter === 'all' || log.table_name === tableFilter;

    return matchesSearch && matchesAction && matchesTable;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatJsonData = (data: any) => {
    if (!data) return 'N/A';
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return 'Invalid JSON';
    }
  };

  if (isLoading || isLoadingLogs) {
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

  const totalLogs = auditLogs.length;
  const insertActions = auditLogs.filter(log => log.action === 'INSERT').length;
  const updateActions = auditLogs.filter(log => log.action === 'UPDATE').length;
  const deleteActions = auditLogs.filter(log => log.action === 'DELETE').length;

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
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
                <p className="text-gray-600">Track all data changes and user activities</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Events</p>
                      <p className="text-2xl font-bold text-gray-900">{totalLogs}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Creates</p>
                      <p className="text-2xl font-bold text-green-600">{insertActions}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Database className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Updates</p>
                      <p className="text-2xl font-bold text-blue-600">{updateActions}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Database className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Deletes</p>
                      <p className="text-2xl font-bold text-red-600">{deleteActions}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <Database className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-lg mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="w-5 h-5" />
                  <span>Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search user, table, or record..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Action</label>
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="insert">Create</SelectItem>
                        <SelectItem value="update">Update</SelectItem>
                        <SelectItem value="delete">Delete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Table</label>
                    <Select value={tableFilter} onValueChange={setTableFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tables</SelectItem>
                        <SelectItem value="marriages">Marriages</SelectItem>
                        <SelectItem value="user_profiles">User Profiles</SelectItem>
                        <SelectItem value="user_departments">User Departments</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={fetchAuditLogs} className="w-full">
                      Refresh Logs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audit Logs Table */}
            <Card className="backdrop-blur-lg bg-white/80 border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle>Audit Log Entries</CardTitle>
                <CardDescription>
                  Showing {filteredLogs.length} of {totalLogs} audit log entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Table</TableHead>
                        <TableHead>Record ID</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">
                                {new Date(log.created_at).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(log.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">
                                {log.user_profiles?.full_name || 'System'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {log.user_profiles?.email || 'N/A'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getActionColor(log.action)}>
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{log.table_name}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs text-gray-600">
                              {log.record_id?.slice(0, 8)}...
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {log.departments?.name || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <details className="cursor-pointer">
                              <summary className="text-blue-600 hover:text-blue-800 text-sm">
                                View Changes
                              </summary>
                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                {log.action === 'UPDATE' && (
                                  <>
                                    <div className="mb-2">
                                      <strong>Old Values:</strong>
                                      <pre className="whitespace-pre-wrap text-xs">
                                        {formatJsonData(log.old_values)}
                                      </pre>
                                    </div>
                                    <div>
                                      <strong>New Values:</strong>
                                      <pre className="whitespace-pre-wrap text-xs">
                                        {formatJsonData(log.new_values)}
                                      </pre>
                                    </div>
                                  </>
                                )}
                                {log.action === 'INSERT' && (
                                  <div>
                                    <strong>Created:</strong>
                                    <pre className="whitespace-pre-wrap text-xs">
                                      {formatJsonData(log.new_values)}
                                    </pre>
                                  </div>
                                )}
                                {log.action === 'DELETE' && (
                                  <div>
                                    <strong>Deleted:</strong>
                                    <pre className="whitespace-pre-wrap text-xs">
                                      {formatJsonData(log.old_values)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </details>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {filteredLogs.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No audit logs found matching your criteria.</p>
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