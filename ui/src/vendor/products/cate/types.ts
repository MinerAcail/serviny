export interface Product {
    id: string;
    name: string;
    price: number;
    state: string;
    categories: string[];
    imageUrls: string[];
  }
  
  export interface Box {
    id: string;
    name: string;
    imageFile?: File | null;
    items: Product[];
  }