import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Plus, Edit, Trash2, Users } from 'lucide-react';
import { type BreadcrumbItem, User, Role, Permission } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { UserModal } from '@/components/Admin/UserModal';
import { RoleModal } from '@/components/Admin/RoleModal';
import { DeleteConfirmationModal } from '@/components/Admin/DeleteConfirmationModal';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Panel',
        href: '/admin',
    },
];

interface AdminPageProps {
    users: User[];
    roles: Role[];
    permissions: Permission[];
    stats: {
        total_users: number;
        active_users: number;
        admin_users: number;
        new_users: number;
        total_roles: number;
        total_permissions: number;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

interface PageProps {
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Admin({ users, roles, permissions, stats }: AdminPageProps) {
    const { flash: pageFlash } = usePage<PageProps>().props;

    // Show flash messages
    useEffect(() => {
        if (pageFlash?.success) {
            toast.success(pageFlash.success);
        }
        if (pageFlash?.error) {
            toast.error(pageFlash.error);
        }
    }, [pageFlash]);

    // Modal states
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    // Modal data
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [deleteItem, setDeleteItem] = useState<{ type: 'user' | 'role'; name: string; url: string } | null>(null);

    // Modal modes
    const [userModalMode, setUserModalMode] = useState<'create' | 'edit'>('create');
    const [roleModalMode, setRoleModalMode] = useState<'create' | 'edit'>('create');

    const handleAddUser = () => {
        setUserModalMode('create');
        setSelectedUser(null);
        setUserModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setUserModalMode('edit');
        setSelectedUser(user);
        setUserModalOpen(true);
    };

    const handleDeleteUser = (user: User) => {
        setDeleteItem({
            type: 'user',
            name: user.name,
            url: `/admin/users/${user.id}`,
        });
        setDeleteModalOpen(true);
    };

    const handleAddRole = () => {
        setRoleModalMode('create');
        setSelectedRole(null);
        setRoleModalOpen(true);
    };

    const handleEditRole = (role: Role) => {
        setRoleModalMode('edit');
        setSelectedRole(role);
        setRoleModalOpen(true);
    };

    const closeUserModal = () => {
        setUserModalOpen(false);
        setSelectedUser(null);
    };

    const closeRoleModal = () => {
        setRoleModalOpen(false);
        setSelectedRole(null);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setDeleteItem(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Panel" />
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <Heading title="Admin Panel" description="Manage users, roles, and system permissions" />
                </div>

                <Tabs defaultValue="users" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="users">User Management</TabsTrigger>
                        <TabsTrigger value="roles">Role Management</TabsTrigger>
                    </TabsList>

                    {/* Users Tab */}
                    <TabsContent value="users" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">User Management</h2>
                                <p className="text-sm text-muted-foreground">
                                    Manage regular users only. Admin users should use their profile settings at <code className="bg-muted px-1 py-0.5 rounded text-xs">/settings/profile</code>
                                </p>
                            </div>
                            <Button onClick={handleAddUser}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add User
                            </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total_users}</div>
                                    <p className="text-xs text-muted-foreground">Manageable users</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.active_users}</div>
                                    <p className="text-xs text-muted-foreground">Active accounts</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.admin_users}</div>
                                    <p className="text-xs text-muted-foreground">Use profile settings</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">New Users</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.new_users}</div>
                                    <p className="text-xs text-muted-foreground">This month</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Users</CardTitle>
                                <CardDescription>
                                    Manage system users and their roles
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {users.map((user) => (
                                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Badge variant={user.roles.some((role: { name: string }) => role.name === 'admin') ? 'default' : 'secondary'}>
                                                    {user.roles[0]?.name || 'No Role'}
                                                </Badge>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditUser(user)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteUser(user)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Roles Tab */}
                    <TabsContent value="roles" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">Role Management</h2>
                                <p className="text-sm text-muted-foreground">
                                    Manage regular and custom roles. Admin role has full permissions and is managed through profile settings.
                                </p>
                            </div>
                            <Button onClick={handleAddRole}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Role
                            </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Manageable Roles</CardTitle>
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{roles.filter(role => role.name !== 'admin').length}</div>
                                    <p className="text-xs text-muted-foreground">Editable roles</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.admin_users}</div>
                                    <p className="text-xs text-muted-foreground">Use profile settings</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total_users}</div>
                                    <p className="text-xs text-muted-foreground">Manageable users</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Permissions</CardTitle>
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total_permissions}</div>
                                    <p className="text-xs text-muted-foreground">Total permissions</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Roles</CardTitle>
                                <CardDescription>
                                    Manage system roles and their permissions (Admin role has full permissions and is managed through profile settings)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {roles.filter(role => role.name !== 'admin').map((role) => (
                                        <div key={role.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                                                    {role.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{role.name.charAt(0).toUpperCase() + role.name.slice(1)}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {role.name === 'user' ? 'Basic user access' : 'Custom role'}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {role.permissions?.slice(0, 3).map((permission: Permission) => (
                                                            <Badge key={permission.id} variant="outline" className="text-xs">
                                                                {permission.name}
                                                            </Badge>
                                                        ))}
                                                        {role.permissions && role.permissions.length > 3 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                +{role.permissions.length - 3} more
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Badge variant="secondary">
                                                    {role.users?.length || 0} users
                                                </Badge>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditRole(role)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                {/* s */}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Modals */}
                <UserModal
                    isOpen={userModalOpen}
                    onClose={closeUserModal}
                    user={selectedUser}
                    roles={roles}
                    mode={userModalMode}
                />

                <RoleModal
                    isOpen={roleModalOpen}
                    onClose={closeRoleModal}
                    role={selectedRole}
                    permissions={permissions}
                    mode={roleModalMode}
                />

                {deleteItem && (
                    <DeleteConfirmationModal
                        isOpen={deleteModalOpen}
                        onClose={closeDeleteModal}
                        itemType={deleteItem.type}
                        itemName={deleteItem.name}
                        deleteUrl={deleteItem.url}
                    />
                )}
            </div>
        </AppLayout>
    );
}
