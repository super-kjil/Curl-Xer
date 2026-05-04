import { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DomainLink } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '../ui/switch';

interface DomainLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    link: DomainLink | null;
    mode: 'create' | 'edit';
}

export function DomainLinkModal({ isOpen, onClose, link, mode }: DomainLinkModalProps) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        title: '',
        badge: '',
        description: '',
        url: '',
        is_active: true,
    });

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && link) {
                setData({
                    title: link.title,
                    badge: link.badge || '',
                    description: link.description || '',
                    url: link.url,
                    is_active: link.is_active,
                });
            } else {
                reset();
            }
            clearErrors();
        }
    }, [isOpen, link, mode]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === 'create') {
            post('/admin/domain-links', {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        } else if (mode === 'edit' && link) {
            put(`/admin/domain-links/${link.id}`, {
                onSuccess: () => {
                    onClose();
                },
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? 'Add Domain Link' : 'Edit Domain Link'}</DialogTitle>
                    <DialogDescription>
                        {mode === 'create'
                            ? "Add a new dynamic link to the Domain List page."
                            : "Update the selected domain link details."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="e.g. Block list Dashboard"
                        />
                        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="badge">Badge (Optional)</Label>
                        <Input
                            id="badge"
                            value={data.badge}
                            onChange={(e) => setData('badge', e.target.value)}
                            placeholder="e.g. DNS -1"
                        />
                        {errors.badge && <p className="text-sm text-red-500">{errors.badge}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="e.g. Access the external dashboard"
                        />
                        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="url">URL</Label>
                        <Input
                            id="url"
                            value={data.url}
                            onChange={(e) => setData('url', e.target.value)}
                            placeholder="http://..."
                        />
                        {errors.url && <p className="text-sm text-red-500">{errors.url}</p>}
                    </div>



                    <div className="flex items-center justify-between space-y-2">
                        <Label htmlFor="is_active">Active Status</Label>
                        <Switch
                            id="is_active"
                            checked={data.is_active}
                            onCheckedChange={(checked) => setData('is_active', checked)}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Link'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
