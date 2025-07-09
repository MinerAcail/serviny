import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Trash, Plus, ShoppingCart, ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Item {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  price: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  items: Item[];
}

interface CardPreviewProps {
  isOpen: boolean;
  category: Category | null;
  onClose: () => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
}

export function CardPreview({ isOpen, category, onClose, onDeleteItem }: CardPreviewProps) {
  if (!category) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
        {/* Hero image with overlay and back button */}
        <div className="relative h-40 w-full">
          <img 
            src={category.imageUrl || "/placeholder.svg"} 
            alt={category.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end p-4">
            <div>
              <DialogTitle className="text-white text-xl font-bold mb-1">
                {category.name}
              </DialogTitle>
              {category.description && (
                <p className="text-white text-sm opacity-90">{category.description}</p>
              )}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 left-2 text-white hover:bg-black hover:bg-opacity-20" 
            onClick={onClose}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Badge className="absolute top-2 right-2 bg-primary">
            {category.items.length} Items
          </Badge>
        </div>

        {/* Items grid in scrollable area */}
        <ScrollArea className="max-h-[60vh] px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 py-4">
            {category.items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="relative">
                  <img 
                    src={item.imageUrl || "/placeholder.svg"} 
                    alt={item.name} 
                    className="w-full h-24 object-cover"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-1 right-1 h-6 w-6 text-red-500 bg-white rounded-full p-1 shadow-sm"
                    onClick={() => onDeleteItem(category.id, item.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="p-2">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="font-semibold text-sm">${item.price}</p>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Fixed footer with actions */}
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t p-3 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Selected category</p>
            <p className="font-medium">{category.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Add New
              <Plus className="ml-1 h-4 w-4" />
            </Button>
            <Button size="sm">
              Add to Cart
              <ShoppingCart className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}