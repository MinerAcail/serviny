import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card } from "@/components/ui/card";
import { Product } from './types';

interface ProductItemProps {
  product: Product;
}

export const ProductItem: React.FC<ProductItemProps> = ({ product }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: product.id,
    data: { type: 'product', product }
  });

  return (
    <Card 
      ref={setNodeRef} 
      className={`p-4 hover:shadow-md transition-shadow cursor-grab ${isDragging ? 'opacity-50' : ''}`}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-primary/10 p-[3px] rounded-md">
          <img
            src={product.imageUrls[0]}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <h3 className="font-medium">{product.name}</h3>
          <p className="text-sm text-muted-foreground">${product.price}</p>
        </div>
      </div>
    </Card>
  );
};



import { useDroppable } from '@dnd-kit/core';

interface ProductsContainerProps {
  children: React.ReactNode;
}

export const ProductsContainer: React.FC<ProductsContainerProps> = ({ children }) => {
  const { setNodeRef } = useDroppable({
    id: "products",
    data: { type: 'products-container' }
  });

  return (
    <div 
      ref={setNodeRef}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {children}
    </div>
  );
};
