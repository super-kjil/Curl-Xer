import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useForm } from '@inertiajs/react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemType: 'user' | 'role';
    itemName: string;
    deleteUrl: string;
}

export function DeleteConfirmationModal({ 
    isOpen, 
    onClose, 
    itemType, 
    itemName, 
    deleteUrl 
}: DeleteConfirmationModalProps) {
    const { delete: destroy, processing } = useForm();

    const handleDelete = () => {
        destroy(deleteUrl, {
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this {itemType}? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                        <strong>{itemName}</strong> will be permanently removed from the system.
                    </p>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button 
                        type="button" 
                        variant="destructive" 
                        onClick={handleDelete}
                        disabled={processing}
                    >
                        {processing ? 'Deleting...' : `Delete ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
