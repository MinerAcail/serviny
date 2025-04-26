import MenuBar from './menuBar'
// import MultipleCountdown from '@/components/custom/timer';
import { useCart } from '@/hooks/CartContext';
import  React, { useState } from 'react'
type NavBarProps = {
  onSearch?: (value: string) => void;
}

const NavBar: React.FC<NavBarProps> = ({ onSearch }) => {
      const [selectedCategory, setSelectedCategory] = useState<string>("All");
    
      const { cart, hostelDetails, setHostelDetails, removeFromCart,  placeOrder } = useCart();
      const categories: string[] = [
        "All",
        // ...new Set(products.flatMap((item) => item.categories)),
      ];
  return (
 <>
    <MenuBar
    CartSidebarProps={{
      cart,
      hostelDetails,
      setHostelDetails,
      removeFromCart,
      placeOrder,
    }}
    categories={categories}
    selectedCategory={selectedCategory}
    setSelectedCategory={setSelectedCategory}
    onSearch={onSearch}

  />
 </>
  
  )
}

export default NavBar