import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from '@inertiajs/react';
import { Role, Permission } from '@/types';

interface RoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    role?: Role | null;
    permissions: Permission[];
    mode: 'create' | 'edit';
}

export function RoleModal({ isOpen, onClose, role, permissions, mode }: RoleModalProps) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        permissions: [] as string[],
    });

    useEffect(() => {
        if (role && mode === 'edit') {
            setData({
                name: role.name,
                permissions: role.permissions?.map(p => p.name) || [],
            });
        } else {
            reset();
        }
    }, [role, mode, setData, reset]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (mode === 'create') {
            post('/admin/roles', {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        } else if (role) {
            put(`/admin/roles/${role.id}`, {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        }
    };

    const handleClose = () => {
        onClose();
        reset();
    };

    const togglePermission = (permissionName: string) => {
        const currentPermissions = data.permissions;
        const newPermissions = currentPermissions.includes(permissionName)
            ? currentPermissions.filter((p: string) => p !== permissionName)
            : [...currentPermissions, permissionName];
        setData('permissions', newPermissions);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Add New Role' : 'Edit Role'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'create' 
                            ? 'Create a new role with specific permissions.'
                            : 'Update role information and permissions.'
                        }
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Role Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Enter role name"
                            required
                            disabled={role?.name === 'admin'}
                        />
                        {role?.name === 'admin' && (
                            <p className="text-xs text-muted-foreground">
                                Admin role cannot be edited through this panel. Admin users should use profile settings.
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Note: "admin" role name is reserved and cannot be created or edited.
                        </p>
                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Permissions</Label>
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
                            {permissions.map((permission) => (
                                <div key={permission.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`permission-${permission.id}`}
                                        checked={data.permissions.includes(permission.name)}
                                        onCheckedChange={() => togglePermission(permission.name)}
                                        disabled={role?.name === 'admin'}
                                    />
                                    <Label 
                                        htmlFor={`permission-${permission.id}`}
                                        className={`text-sm font-normal ${role?.name === 'admin' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                    >
                                        {permission.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </Label>
                                </div>
                            ))}
                        </div>
                        {role?.name === 'admin' && (
                            <p className="text-xs text-muted-foreground">
                                Admin role permissions cannot be modified through this panel.
                            </p>
                        )}
                        {errors.permissions && <p className="text-sm text-red-500">{errors.permissions}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing || role?.name === 'admin'}>
                            {processing ? 'Saving...' : mode === 'create' ? 'Create Role' : 'Update Role'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
